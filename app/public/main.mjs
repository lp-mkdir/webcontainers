import { WebContainer } from "https://cdn.jsdelivr.net/npm/@webcontainer/api@1.1.9/dist/index.min.js";

let webcontainerInstance;

const files = {
  "index.js": {
    file: {
      contents: `
import express from 'express';
const app = express();
const port = 3111;

app.get('/', (req, res) => {
  res.send('Welcome to a WebContainers app! 🥳');
});

app.listen(port, () => {
  console.log(\`App is live at http://localhost:\${port}\`);
});`,
    },
  },
  "package.json": {
    file: {
      contents: `
{
  "name": "example-app",
  "type": "module",
  "dependencies": {
    "express": "latest",
    "nodemon": "latest"
  },
  "scripts": {
    "start": "nodemon --watch './' index.js"
  }
}`,
    },
  },
};

const iframeEl = document.getElementById("preview-iframe");
const cmdForm = document.getElementById("command-form");

async function installDependencies() {
  // Install dependencies
  const installProcess = await webcontainerInstance.spawn("npm", ["install"]);
  installProcess.output.pipeTo(
    new WritableStream({
      write(data) {
        console.log(data);
      },
    })
  );
  // Wait for install command to exit
  return installProcess.exit;
}

async function startDevServer() {
  // Run `npm run start` to start the Express app
  const run = await webcontainerInstance.spawn("npm", ["run", "start"]);
  run.output.pipeTo(
    new WritableStream({
      write(data) {
        console.log(data);
      },
    })
  );

  // Wait for `server-ready` event
  webcontainerInstance.on("server-ready", (_port, url) => {
    iframeEl.src = url;
  });
}

async function writeIndexJS(content) {
  try {
    await webcontainerInstance.fs.writeFile("/index.js", content);
  } catch (error) {
    console.error(error);
  }
}

const textareaElement = document.querySelector("textarea");
const runButton = document.getElementById("run-code-btn");
// const uploadFileBtn = document.getElementById("upload-file-btn");
const textareaFileList = document.getElementById("file-list");

window.addEventListener("load", async () => {
  textareaElement.value = files["index.js"].file.contents;
  // Call only once
  webcontainerInstance = await WebContainer.boot();
  await webcontainerInstance.mount(files);

  const exitCode = await installDependencies();
  if (exitCode !== 0) {
    throw new Error("Installation failed");
  }

  startDevServer();

  runButton.addEventListener("click", () => {
    const code = textareaElement.value;
    writeIndexJS(code);
  });

  textareaFileList.addEventListener("input", async () => {
    const fileNames = extractFileNames(textareaFileList.value);
    let files = {};

    const fileContentsPromises = fileNames.map(async (fileName) => {
      const contents = await fetchFileContent(fileName);
      return { fileName, contents };
    });

    // Wait for all file contents to be fetched
    const filesContents = await Promise.all(fileContentsPromises);

    // Construct the `files` object for mounting
    filesContents.forEach(({ fileName, contents }) => {
      files[fileName] = {
        file: {
          contents: contents,
        },
      };
    });

    await webcontainerInstance.mount(files);

    const pwd = await webcontainerInstance.spawn("ls", ["-la"]);
    pwd.output.pipeTo(
      new WritableStream({
        write(data) {
          console.log(data);
        },
      })
    );
  });

  async function runCommand(command, args) {
    const res = await webcontainerInstance.spawn(command, args);

    if (await res.exit === 0) {
      res.output.pipeTo(
        new WritableStream({
          write(data) {
            console.log(data);
          },
        })
      );
    }

    res.output.pipeTo(
      new WritableStream({
        write(data) {
          console.log(data);
        },
      })
    );
  }

  cmdForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = new FormData(e.target);

    const text = data.get("command");

    const [command, ...args] = text.split(" ");
    await runCommand(command, args);
  });

  const pwd = await webcontainerInstance.spawn("ls", ["-la"]);

  pwd.output.pipeTo(
    new WritableStream({
      write(data) {
        console.log(data);
      },
    })
  );
});

function extractFileNames(textareaContent) {
  const lines = textareaContent.split("\n");

  // Filter out any lines that don't represent file paths and remove "Files:" line
  const fileNames = lines
    .filter((line) => line.trim() !== "" && !line.includes("Files:"))
    .map((path) => path.split("/").pop()); // Extract the file name

  return fileNames;
}

async function fetchFileContent(fileName) {
  const response = await fetch(`/uploads/${fileName}`);
  if (!response.ok)
    throw new Error(`Failed to fetch ${fileName}: ${response.statusText}`);
  return await response.text();
}
