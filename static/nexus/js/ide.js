document.addEventListener('DOMContentLoaded', function () {
    const editor = CodeMirror.fromTextArea(document.getElementById('code-editor'), {
        lineNumbers: true,
        mode: 'text/x-aql',
        theme: 'material-darker'
    });

    const developBtn = document.getElementById('develop-btn');
    const compileBtn = document.getElementById('compile-btn');
    const imageBtn = document.getElementById('image-btn');
    const debugBtn = document.getElementById('debug-btn');
    const copyBtn = document.getElementById('copy-btn');
    const userInput = document.getElementById('user-input');
    const chatBox = document.getElementById('chat-box');
    const compilerOutput = document.getElementById('compiler-output');
    const dropzone = document.getElementById('dropzone');
    const fileInput = document.getElementById('fileInput');
    const attachedFilesContainer = document.getElementById('attached-files');
    const voiceBtnNexus = document.getElementById('voice-btn-nexus');
    const minimizeBtn = document.getElementById('minimize-btn');
    const aiContainer = document.getElementById('ai-container');
    const mainContent = document.querySelector('.main-content');
    const editorContainer = document.querySelector('.editor');
    const outputDisplay = document.querySelector('.output-display');
    const repopulateBtn = document.createElement('button');
    const pdfModal = document.querySelector('#pdfModal');
    const pdfViewerBtn = document.querySelector('#pdf-viewer-btn');
    const myModal = document.querySelector('#myModal');
    const closeModalBtn = document.querySelector('.close');
    const confirmBtn = document.getElementById('confirm-btn');
    const cancelBtn = document.getElementById('cancel-btn');
    const closePdfBtns = document.querySelectorAll('.close-pdf');
    const warningMessage = document.createElement('div');

    let attachedFiles = [];
    let developPressed = false;

    // Warning message
    warningMessage.classList.add('warning-message');
    warningMessage.innerHTML = `
        <p>Your current prompt will be cleared. Do you want to proceed?</p>
        <button id="cancel-warning-btn" class="btn-secondary">Cancel</button>
        <button id="confirm-warning-btn" class="btn-primary">Confirm</button>`;
    warningMessage.style.display = 'none';
    document.body.appendChild(warningMessage);

    const cancelWarningBtn = document.getElementById('cancel-warning-btn');
    const confirmWarningBtn = document.getElementById('confirm-warning-btn');

    // Remove placeholder messages
    function removePlaceholders() {
        document.querySelectorAll('.placeholder-message').forEach(elem => elem.remove());
    }

    // Voice recognition
    if ('webkitSpeechRecognition' in window) {
        const recognition = new webkitSpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onresult = function (event) {
            const transcript = event.results[0][0].transcript;
            userInput.value += transcript;
        };

        recognition.onstart = function () {
            voiceBtnNexus.classList.add('active');
        };

        recognition.onend = function () {
            voiceBtnNexus.classList.remove('active');
        };

        voiceBtnNexus.addEventListener('click', function () {
            recognition.start();
        });
    } else {
        voiceBtnNexus.style.display = 'none';
    }

    // Develop button event listener
    developBtn.addEventListener('click', function () {
        const userMessage = userInput.value.trim();
        if (userMessage && checkForWarning()) {
            developPressed = true;
            showWarning();
        } else {
            runDevelop(userMessage);
        }
    });

    function runDevelop(userMessage) {
        removePlaceholders();
        appendMessage('sent', userMessage, chatBox);
        userInput.value = '';

        const formData = new FormData();
        formData.append('text', userMessage);
        attachedFiles.forEach((file, index) => {
            formData.append(`file${index}`, file);
        });

        fetch('/generate/', {
            method: 'POST',
            headers: {
                'X-CSRFToken': getCookie('csrftoken')
            },
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            const generatedText = data.generated_text || data.result;
            appendMessage('received', generatedText, chatBox);
            editor.setValue(generatedText);
        })
        .catch(error => {
            appendMessage('received', `Error: ${error.message}`, chatBox);
        });
    }

    // Compile button event listener for text
    compileBtn.addEventListener('click', function () {
        compileCode();
    });

    function compileCode() {
        const code = editor.getValue();
        const formData = new FormData();
        formData.append('text', code);
        formData.append('output_format', 'text');
        attachedFiles.forEach((file, index) => {
            formData.append(`file${index}`, file);
        });

        fetch('/compile/', {
            method: 'POST',
            headers: {
                'X-CSRFToken': getCookie('csrftoken')
            },
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            displayOutput(data.result, 'Compiler Output');
        })
        .catch(error => {
            appendMessage('received', `Error: ${error.message}`, compilerOutput);
        });
    }

    // Image button event listener
    imageBtn.addEventListener('click', function () {
        generateImage();
    });

    function generateImage() {
        const code = editor.getValue();
        const formData = new FormData();
        formData.append('text', code);
        formData.append('output_format', 'image');
        attachedFiles.forEach((file, index) => {
            formData.append(`file${index}`, file);
        });

        fetch('/compile/', {
            method: 'POST',
            headers: {
                'X-CSRFToken': getCookie('csrftoken')
            },
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            displayOutput(data.result, 'Image Output');
        })
        .catch(error => {
            appendMessage('received', `Error: ${error.message}`, compilerOutput);
        });
    }

    // Debug button event listener
    debugBtn.addEventListener('click', function () {
        debugCode();
    });

    function debugCode() {
        const code = editor.getValue();
        const formData = new FormData();
        formData.append('text', code);
        attachedFiles.forEach((file, index) => {
            formData.append(`file${index}`, file);
        });

        fetch('/debug/', {
            method: 'POST',
            headers: {
                'X-CSRFToken': getCookie('csrftoken')
            },
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            displayOutput(data.result, 'Debug Output');
        })
        .catch(error => {
            appendMessage('received', `Error: ${error.message}`, compilerOutput);
        });
    }

    // Copy button event listener
    copyBtn.addEventListener('click', function () {
        navigator.clipboard.writeText(editor.getValue()).then(() => {
            alert('Prompt copied to clipboard!');
        });
    });

    // File upload handling
    dropzone.addEventListener('click', () => fileInput.click());
    dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.style.backgroundColor = '#f0f0f0';
    });
    dropzone.addEventListener('dragleave', () => dropzone.style.backgroundColor = '#f9f9f9');
    dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.style.backgroundColor = '#f9f9f9';
        handleFiles(e.dataTransfer.files);
    });
    fileInput.addEventListener('change', () => handleFiles(fileInput.files));

    function handleFiles(files) {
        for (const file of files) {
            displayAttachedFile(file);
            attachedFiles.push(file);
        }
    }

    function displayAttachedFile(file) {
        const fileElem = document.createElement('div');
        fileElem.classList.add('attached-file');
        fileElem.innerHTML = `Attached file: ${file.name} <button class="remove-btn" button id="remove-btn" data-file-name="${file.name}">Remove</button>`;
        attachedFilesContainer.appendChild(fileElem);

        fileElem.querySelector('.remove-btn').addEventListener('click', function () {
            const fileName = this.dataset.fileName;
            removeAttachedFile(fileName, fileElem);
        });
    }

    function removeAttachedFile(fileName, fileElem) {
        attachedFiles = attachedFiles.filter(file => file.name !== fileName);
        attachedFilesContainer.removeChild(fileElem);
    }

    function appendMessage(sender, text, outputElem) {
        const messageElem = document.createElement('div');
        messageElem.classList.add('message', sender);
        messageElem.innerHTML = `<p>${text.replace(/\n/g, '<br>')}</p>`;
        outputElem.appendChild(messageElem);
        outputElem.scrollTop = outputElem.scrollHeight;

        if (sender === 'received') {
            displayOutput(text);
        }
    }

    function displayOutput(data, title = 'Output') {
        const outputElem = document.createElement('div');
        outputElem.classList.add('output-instance');
        if (typeof data === 'string' && data.startsWith('http')) {
            outputElem.innerHTML = `<h3>${title}</h3><img src="${data}" class="responsive-iframe" alt="Generated Image" style="max-width: 100%; height: 200px; align-items: center;" />`;

            const imageElem = outputElem.querySelector('img');
            imageElem.addEventListener('click', function () {
                enlargeImage(data);
            });

            const downloadImageButton = document.createElement('button');
            downloadImageButton.innerHTML = '⬇️';
            downloadImageButton.classList.add('download-btn');
            downloadImageButton.addEventListener('click', function () {
                downloadImage(data);
            });
            outputElem.appendChild(downloadImageButton);
        } else if (typeof data === 'string') {
            outputElem.innerHTML = `<h3>${title}</h3><p>${data.replace(/\n/g, '<br>')}</p>`;

            // Add button to convert text to speech if it's text output
            const speechButton = document.createElement('button');
            speechButton.innerHTML = '🔊';
            speechButton.classList.add('speech-btn');
            speechButton.addEventListener('click', function () {
                readTextAloud(data);
            });
            outputElem.appendChild(speechButton);

            // Add button to download text as Word document
            const downloadButton = document.createElement('button');
            downloadButton.innerHTML = '⬇️';
            downloadButton.classList.add('download-btn');
            downloadButton.addEventListener('click', function () {
                downloadAsWord(data);
            });
            outputElem.appendChild(downloadButton);
        } else {
            outputElem.innerHTML = `<p>Error: No valid output received.</p>`;
        }

        compilerOutput.appendChild(outputElem);
        compilerOutput.scrollTop = compilerOutput.scrollHeight;
    }

    // Add function to read text aloud using Web Speech API
    function readTextAloud(text) {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            window.speechSynthesis.speak(utterance);
        } else {
            alert('Your browser does not support text-to-speech.');
        }
    }

    // Add function to download text as a Word document
    function downloadAsWord(text) {
        const blob = new Blob([text], { type: 'application/msword' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'generated_text.doc';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }

    // Add function to enlarge an image
    function enlargeImage(imageUrl) {
        const modal = document.createElement('div');
        modal.classList.add('modal');
        modal.innerHTML = `<div class="modal-content"><span class="close">&times;</span><img src="${imageUrl}" class="enlarged-image" /></div>`;
        document.body.appendChild(modal);

        const closeModal = modal.querySelector('.close');
        closeModal.addEventListener('click', function () {
            document.body.removeChild(modal);
        });
    }

    // Add function to download an image
    function downloadImage(imageUrl) {
        const a = document.createElement('a');
        a.href = imageUrl;
        a.download = 'generated_image.png';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }

    // CSRF token handling
    function getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }

    // Resizable panels
    const resizers = document.querySelectorAll('.resizer');
    let isResizing = false;
    let currentResizer;

    resizers.forEach(resizer => {
        resizer.addEventListener('mousedown', function (e) {
            isResizing = true;
            currentResizer = resizer;
            document.addEventListener('mousemove', resize);
            document.addEventListener('mouseup', stopResize);
        });
    });

    function resize(e) {
        if (!isResizing) return;

        const container = currentResizer.parentElement;
        const rect = container.getBoundingClientRect();

        if (currentResizer.classList.contains('resizer-right')) {
            container.style.width = e.clientX - rect.left + 'px';
        } else if (currentResizer.classList.contains('resizer-left')) {
            container.style.width = rect.right - e.clientX + 'px';
            container.style.left = e.clientX + 'px';
        } else if (currentResizer.classList.contains('resizer-bottom')) {
            container.style.height = e.clientY - rect.top + 'px';
        } else if (currentResizer.classList.contains('resizer-top')) {
            container.style.height = rect.bottom - e.clientY + 'px';
            container.style.top = e.clientY + 'px';
        } else if (currentResizer.classList.contains('resizer-top-left')) {
            container.style.width = rect.right - e.clientX + 'px';
            container.style.left = e.clientX + 'px';
            container.style.height = rect.bottom - e.clientY + 'px';
            container.style.top = e.clientY + 'px';
        } else if (currentResizer.classList.contains('resizer-top-right')) {
            container.style.width = e.clientX - rect.left + 'px';
            container.style.height = rect.bottom - e.clientY + 'px';
            container.style.top = e.clientY + 'px';
        } else if (currentResizer.classList.contains('resizer-bottom-left')) {
            container.style.width = rect.right - e.clientX + 'px';
            container.style.left = e.clientX + 'px';
            container.style.height = e.clientY - rect.top + 'px';
        } else if (currentResizer.classList.contains('resizer-bottom-right')) {
            container.style.width = e.clientX - rect.left + 'px';
            container.style.height = e.clientY - rect.top + 'px';
        }

        // Ensure the container stays within the viewport
        container.style.maxWidth = window.innerWidth - container.offsetLeft + 'px';
        container.style.maxHeight = window.innerHeight - container.offsetTop + 'px';
    }

    function stopResize() {
        isResizing = false;
        document.removeEventListener('mousemove', resize);
        document.removeEventListener('mouseup', stopResize);
    }

    // Minimize button functionality
    minimizeBtn.addEventListener('click', function () {
        if (aiContainer.style.display === 'none') {
            aiContainer.style.display = 'block';
            minimizeBtn.textContent = '-';
            repopulateBtn.style.display = 'none';
        } else {
            aiContainer.style.display = 'none';
            minimizeBtn.textContent = '+';
            repopulateBtn.style.display = 'block';
            // Automatically resize adjacent panels
            const newEditorWidth = mainContent.clientWidth / 2;
            editorContainer.style.width = `${newEditorWidth}px`;
            editorContainer.style.flexBasis = `${newEditorWidth}px`;
            outputDisplay.style.width = `${newEditorWidth}px`;
            outputDisplay.style.flexBasis = `${newEditorWidth}px`;
        }
    });

    // Repopulate button functionality
    repopulateBtn.id = 'repopulate-btn';
    repopulateBtn.textContent = 'My Nexus';
    repopulateBtn.style.display = 'none';
    mainContent.appendChild(repopulateBtn);

    repopulateBtn.addEventListener('click', function () {
        aiContainer.style.display = 'block';
        minimizeBtn.textContent = '-';
        repopulateBtn.style.display = 'none';
    });

    closeModalBtn.addEventListener('click', function () {
        myModal.style.display = 'none';
    });

    cancelBtn.addEventListener('click', function () {
        myModal.style.display = 'none';
    });

    confirmBtn.addEventListener('click', function () {
        myModal.style.display = 'none';
        if (developPressed) {
            runDevelop(userInput.value.trim());
            developPressed = false;
        } else {
            editor.setValue('');  // Clear the editor
            attachedFiles = [];
            attachedFilesContainer.innerHTML = '';
        }
    });

    pdfViewerBtn.addEventListener('click', function () {
        pdfModal.style.display = 'block';
    });

    closePdfBtns.forEach(btn => {
        btn.addEventListener('click', function () {
            pdfModal.style.display = 'none';
        });
    });

    window.onclick = function (event) {
        if (event.target == pdfModal) {
            pdfModal.style.display = 'none';
        }
    };

    cancelWarningBtn.addEventListener('click', function () {
        warningMessage.style.display = 'none';
    });

    confirmWarningBtn.addEventListener('click', function () {
        warningMessage.style.display = 'none';
        editor.setValue('');
        attachedFiles = [];
        attachedFilesContainer.innerHTML = '';
        if (developPressed) {
            runDevelop(userInput.value.trim());
            developPressed = false;
        }
    });

    function checkForWarning() {
        return userInput.value.trim() !== '' && editor.getValue().trim() !== '';
    }

    function showWarning() {
        warningMessage.style.display = 'block';
    }
});
