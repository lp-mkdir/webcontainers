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

async function installDependencies() {
  // Install dependencies
  const installProcess = await webcontainerInstance.spawn("npm", ["install"]);
  // Wait for install command to exit
  return installProcess.exit;
}

async function startDevServer() {
  // Run `npm run start` to start the Express app
  await webcontainerInstance.spawn('npm', ['run', 'start']);

  // Wait for `server-ready` event
  webcontainerInstance.on('server-ready', (_port, url) => {
    iframeEl.src = url;
  });
}

async function writeIndexJS(content) {
  await webcontainerInstance.fs.writeFile('/index.js', content);
};

const textareaElement = document.querySelector("textarea");
const runButton = document.getElementById("run-code-btn");

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

  runButton.addEventListener('click', () => {
    const code = textareaElement.value;
    writeIndexJS(code);
  });

  const pwd = await webcontainerInstance.spawn('ls', ['-la']);
  
  pwd.output.pipeTo(new WritableStream({
    write(data) {
      console.log(data);
    }
  }));
});
