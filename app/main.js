import './style.css';

// CONST
/** @type {HTMLIFrameElement | null} */
export const iframeEl = document.querySelector('iframe');

/** @type {HTMLTextAreaElement | null} */
export const textareaEl = document.querySelector('textarea');

document.querySelector('#app').innerHTML = `
  <div class="container">
    <div class="editor">
      <textarea>I am a textarea</textarea>
    </div>
    <div class="preview">
      <iframe src="loading.html"></iframe>
    </div>
  </div>
`
