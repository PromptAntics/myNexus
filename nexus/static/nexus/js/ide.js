document.addEventListener('DOMContentLoaded', function () {
    const body = document.body;
    const codeEditor = document.querySelector('#code-editor');
    const editor = CodeMirror.fromTextArea(codeEditor, {
        lineNumbers: true,
        mode: 'text/x-aql',
        theme: 'material-darker'
    });

    const emojiPickerBtn = document.querySelector('#emoji-picker-btn');
    const emojiPickerContainer = document.querySelector('#emoji-picker');
    const runCodeBtn = document.querySelector('#run-code');
    const copyPromptBtn = document.querySelector('#copy-prompt');
    const outputFormatSelect = document.querySelector('#output-format');
    const myModal = document.querySelector('#myModal');
    const closeModalBtn = document.querySelector('.close');
    const cancelBtn = document.querySelector('#cancel-btn');
    const confirmBtn = document.querySelector('#confirm-btn');
    const pdfModal = document.querySelector('#pdfModal');
    const pdfViewerBtn = document.querySelector('#pdf-viewer-btn');
    const closePdfBtns = document.querySelectorAll('.close-pdf');
    const chatbotInput = document.querySelector('#user-input');
    const chatbotSend = document.querySelector('#send-btn');
    const voiceBtnNexus = document.querySelector('#voice-btn-nexus'); // Voice input button
    const voiceBtnDebugger = document.querySelector('#voice-btn-debugger'); // Voice input button for debugger
    const voiceBtnCompiler = document.querySelector('#voice-btn-compiler'); // Voice input button for compiler
    const messages = document.querySelector('#chat-box');
    const compilerOutput = document.querySelector('#compiler-output');
    const debugInstancesContainer = document.querySelector('#debug-instances');
    const uploadFileBtn = document.querySelector('#upload-file-btn');
    const fileInput = document.querySelector('#file-input');
    const attachedFilesContainer = document.querySelector('#attached-files');
    const sideNav = document.querySelector('#sidenav');
    const taskList = document.querySelector('#tasks');
    const addTaskBtn = document.querySelector('#add-task-btn');
    const newTaskInput = document.querySelector('#new-task');
    const promptTuneSubmitBtn = document.querySelector('#promptTuneSubmitBtn');
    const virtuonCoreSubmitBtn = document.querySelector('#virtuonCoreSubmitBtn');
    const promptTuneOutput = document.querySelector('#debugger-output'); // PromptTune messages container
    let attachedFiles = [];
    let debuggerInstanceId = 0;
    let compilerInstanceId = 0;

    // Initialize emoji picker
    emojiPickerBtn.addEventListener('click', function () {
        if (emojiPickerContainer.style.display === 'block') {
            emojiPickerContainer.style.display = 'none';
        } else {
            emojiPickerContainer.style.display = 'block';
            emojiPickerContainer.innerHTML = ''; // Clear existing emojis
            fetch('https://api.github.com/emojis')
                .then(response => response.json())
                .then(data => {
                    Object.keys(data).forEach(key => {
                        const emoji = document.createElement('span');
                        emoji.innerHTML = `<img src="${data[key]}" alt="${key}" style="width: 20px; cursor: pointer;">`;
                        emoji.addEventListener('click', () => {
                            fetch(`https://emoji-api.com/emojis?search=${key}&access_key=0c639c587d90c1f706db8ef1092511f2ffdbaa7d`)
                                .then(response => response.json())
                                .then(emojiData => {
                                    if (emojiData.length > 0) {
                                        editor.replaceSelection(emojiData[0].character);
                                    }
                                    emojiPickerContainer.style.display = 'none';
                                });
                        });
                        emojiPickerContainer.appendChild(emoji);
                    });
                });
        }
    });


    closeModalBtn.addEventListener('click', function () {
        myModal.style.display = 'none';
    });

    cancelBtn.addEventListener('click', function () {
        myModal.style.display = 'none';
    });

    confirmBtn.addEventListener('click', function () {
        myModal.style.display = 'none';
        editor.setValue('');  // Clear the editor
        sendMessage(chatbotInput, messages, '/generate/');
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

    // Handle file uploads for Edit Zone
    uploadFileBtn.addEventListener('click', function () {
        fileInput.click();
    });

    fileInput.addEventListener('change', function () {
        const file = fileInput.files[0];
        if (file) {
            displayAttachedFile(file);
            attachedFiles.push(file);
        }
    });

    function addCompilerInstance(instanceId, content) {
        const container = document.getElementById('compiler-container');
    
        // Create the compiler instance div
        const compilerInstance = document.createElement('div');
        compilerInstance.className = 'compiler-instance';
        compilerInstance.id = `compiler-instance-${instanceId}`;
    
        // Create the close button
        const closeButton = document.createElement('button');
        closeButton.className = 'close-button';
        closeButton.innerText = 'Close';
        closeButton.onclick = () => {
            document.getElementById(`compiler-instance-${instanceId}`).remove();
        };
    
        // Create the content div
        const contentDiv = document.createElement('div');
        contentDiv.className = 'compiler-content';
        contentDiv.innerHTML = content;
    
        // Append the close button and content div to the compiler instance
        compilerInstance.appendChild(closeButton);
        compilerInstance.appendChild(contentDiv);
    
        // Append the compiler instance to the container
        container.appendChild(compilerInstance);
    }

    // Function to display attached files and images
    function displayAttachedFile(file) {
        const fileElem = document.createElement('div');
        fileElem.classList.add('attached-file');
        fileElem.innerHTML = `Attached file: ${file.name} <button class="remove-file-btn" data-file-name="${file.name}">Remove</button>`;
        attachedFilesContainer.appendChild(fileElem);

        // Add event listener for remove button
        fileElem.querySelector('.remove-file-btn').addEventListener('click', function () {
            const fileName = this.dataset.fileName;
            removeAttachedFile(fileName, fileElem);
        });
    }

    // Function to remove attached files
    function removeAttachedFile(fileName, fileElem) {
        attachedFiles = attachedFiles.filter(file => file.name !== fileName);
        attachedFilesContainer.removeChild(fileElem);
    }

    // Function to run the debugger
    function runDebugger(prompt, generatedOutput) {
        debuggerInstanceId++;
        const instanceId = debuggerInstanceId;
    
        fetch('/debug/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            },
            body: JSON.stringify({ text: `User Prompt: ${prompt}\n\nGenerated Output: ${generatedOutput}` })
        })
        .then(response => response.json())
        .then(data => {
            const result = data.result || data.generated_text || "No result received from the server.";
            const instanceElem = document.createElement('div');
            instanceElem.classList.add('debugger-instance');
            instanceElem.id = `debugger-instance-${instanceId}`;
            instanceElem.innerHTML = `
                <h3>Debugger Instance - ${instanceId}</h3>
                <div class="messages" id="debugger-output-${instanceId}">
                    <div class="message bot"><p>${result.replace(/\n/g, '<br>')}</p></div>
                </div>
                <button class="apply-instance" data-instance-id="${instanceId}">Apply to Edit Zone</button>
                <button class="close-instance" data-instance-id="${instanceId}">Close</button>
            `;
            promptTuneOutput.appendChild(instanceElem); // Append to PromptTune section
            promptTuneOutput.scrollTop = promptTuneOutput.scrollHeight; // Scroll to the bottom
    
            document.querySelector(`button.apply-instance[data-instance-id="${instanceId}"]`).addEventListener('click', function () {
                const debuggerOutput = document.querySelector(`#debugger-output-${instanceId} .message.bot p`).innerHTML;
                const parsedPrompt = parsePrompt(debuggerOutput);
                if (editor.getValue().trim() !== '') {
                    myModal.style.display = 'block';
                    confirmBtn.addEventListener('click', function () {
                        myModal.style.display = 'none';
                        editor.setValue(parsedPrompt);  // Set the editor with parsed prompt
                    });
                } else {
                    editor.setValue(parsedPrompt);  // Set the editor with parsed prompt
                }
            });
    
            document.querySelector(`button.close-instance[data-instance-id="${instanceId}"]`).addEventListener('click', function () {
                document.querySelector(`#debugger-instance-${instanceId}`).remove();
            });
        })
        .catch(error => {
            const instanceElem = document.createElement('div');
            instanceElem.classList.add('debugger-instance');
            instanceElem.id = `debugger-instance-${instanceId}`;
            instanceElem.innerHTML = `
                <h3>Debugger Instance - ${instanceId}</h3>
                <div class="messages" id="debugger-output-${instanceId}">
                    <div class="message bot"><p>Error: ${error.message.replace(/\n/g, '<br>')}</p></div>
                </div>
                <button class="close-instance" data-instance-id="${instanceId}">Close</button>
            `;
            debugInstancesContainer.insertBefore(instanceElem, debugInstancesContainer.firstChild);
            document.querySelector(`#debugger-output-${instanceId}`).scrollTop = document.querySelector(`#debugger-output-${instanceId}`).scrollHeight;
    
            document.querySelector(`button[data-instance-id="${instanceId}"]`).addEventListener('click', function () {
                document.querySelector(`#debugger-instance-${instanceId}`).remove();
            });
        });
    }
    
    


    function parsePrompt(text) {
        const beginPrompt = 'BEGIN_PROMPT';
        const endPrompt = 'END_PROMPT';
        const beginIndex = text.indexOf(beginPrompt) + beginPrompt.length;
        const endIndex = text.indexOf(endPrompt);
        if (beginIndex !== -1 && endIndex !== -1) {
            return text.substring(beginIndex, endIndex).trim().replace(/<br>/g, '\n');
        }
        return text.replace(/<br>/g, '\n');  // Fallback to the entire text if not found
    }

    runCodeBtn.addEventListener('click', function () {
        const code = editor.getValue();
        const formData = new FormData();
        formData.append('text', code);
        formData.append('output_format', outputFormatSelect.value);
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
            const result = data.result;
            compilerInstanceId++;
            const instanceElem = document.createElement('div');
            instanceElem.classList.add('compiler-instance');
            instanceElem.innerHTML = `
                <h3>Compiler Instance - ${compilerInstanceId}</h3>
                <div class="compiler-input"><strong>Input Prompt:</strong><p>${code.replace(/\n/g, '<br>')}</p></div>
                <div class="compiler-output"><strong>Output:</strong></div>
            `;
    
            const outputDiv = instanceElem.querySelector('.compiler-output');
            
            if (outputFormatSelect.value === 'text' && result.text) {
                outputDiv.innerHTML += `<p>${result.text.replace(/\n/g, '<br>')}</p>`;
            } else if (outputFormatSelect.value === 'image' && result.image) {
                outputDiv.innerHTML += `<img src="${result.image}" alt="Generated Image" style="max-width: 100%; height: auto;" />`;
            } else if (outputFormatSelect.value === 'speech' && result.speech) {
                const audioElem = document.createElement('audio');
                audioElem.controls = true;
                audioElem.src = result.speech;
                outputDiv.appendChild(audioElem);
            } else {
                outputDiv.innerHTML += `<p>Error: No valid output received.</p>`;
            }
    
            compilerOutput.insertBefore(instanceElem, compilerOutput.firstChild);
            saveInteraction(code, result); // Save the interaction
            runDebugger(code, result.text);  // Pass the code and the generated result to the debugger
    
            // Hide placeholder message if messages are appended
            if (compilerOutput.children.length > 0) {
                const placeholder = compilerOutput.querySelector('.placeholder-message');
                if (placeholder) placeholder.style.display = 'none';
            }
        })
        .catch(error => {
            const instanceElem = document.createElement('div');
            instanceElem.classList.add('compiler-instance');
            instanceElem.innerHTML = `
                <h3>Compiler Instance - ${compilerInstanceId}</h3>
                <div class="compiler-output"><strong>Error:</strong><p>${error.message.replace(/\n/g, '<br>')}</p></div>
            `;
            compilerOutput.insertBefore(instanceElem, compilerOutput.firstChild);
        });
    });
    

    function createAudioElement(src) {
        const audioElem = document.createElement('audio');
        audioElem.controls = true;
        audioElem.src = src;
        return audioElem;
    }

    // Event listener for 'Send' button
    chatbotSend.addEventListener('click', function () {
        if (editor.getValue().trim() !== '' || chatbotInput.value.trim() !== '') {
            myModal.style.display = 'block';
            confirmBtn.onclick = function() {
                myModal.style.display = 'none';
                sendMessage(chatbotInput, messages, '/generate/');
            };
            cancelBtn.onclick = function() {
                myModal.style.display = 'none';
            };
        } else {
            sendMessage(chatbotInput, messages, '/generate/');
        }
    });
      // Function to send message
    function sendMessage(inputElem, outputElem, endpoint) {
        const userMessage = inputElem.value;
        if (userMessage.trim() !== '') {
            appendMessage('sent', userMessage, outputElem);
            inputElem.value = '';

            const formData = new FormData();
            formData.append('text', userMessage);

            fetch(endpoint, {
                method: 'POST',
                headers: {
                    'X-CSRFToken': getCookie('csrftoken')
                },
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                const generatedText = data.generated_text || data.result;
                appendMessage('received', generatedText, outputElem);
                editor.setValue(parsePrompt(generatedText).replace(/\\n/g, '\n'));
                saveInteraction(userMessage, generatedText); // Save the interaction

                // Hide placeholder message if messages are appended
                if (outputElem.children.length > 0) {
                    const placeholders = outputElem.querySelectorAll('.placeholder-message');
                    placeholders.forEach(placeholder => placeholder.style.display = 'none');
                }
            })
            .catch(error => {
                appendMessage('received', `Error: ${error.message}`, outputElem);
            });
        }
    }

    function sendMessagePromptTune(inputElem, outputElem, endpoint) {
        const inputText = inputElem.value;
        const formData = new FormData();
        formData.append('text', inputText);
    
        fetch(endpoint, {
            method: 'POST',
            headers: {
                'X-CSRFToken': getCookie('csrftoken')
            },
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            let result = data.result;
            let instanceElem = document.createElement('div');
            instanceElem.classList.add('prompt-tune-instance');
    
            if (result) {
                instanceElem.innerHTML = `
                    <div class="prompt-tune-input"><strong>Input Prompt:</strong><p>${inputText.replace(/\n/g, '<br>')}</p></div>
                    <div class="prompt-tune-output"><strong>Output:</strong><p>${result.replace(/\n/g, '<br>')}</p></div>
                `;
            } else {
                instanceElem.innerHTML = `
                    <div class="prompt-tune-output"><strong>Error:</strong><p>Received an undefined result from the server.</p></div>
                `;
            }
    
            outputElem.insertBefore(instanceElem, outputElem.firstChild);
    
            // Hide placeholder message if messages are appended
            if (outputElem.children.length > 0) {
                const placeholder = outputElem.querySelector('.placeholder-message');
                if (placeholder) placeholder.style.display = 'none';
            }
        })
        .catch(error => {
            let instanceElem = document.createElement('div');
            instanceElem.classList.add('prompt-tune-instance');
            instanceElem.innerHTML = `
                <div class="prompt-tune-output"><strong>Error:</strong><p>${error.message.replace(/\n/g, '<br>')}</p></div>
            `;
            outputElem.insertBefore(instanceElem, outputElem.firstChild);
        });
    }
    
    function sendMessageVirtuonCore(inputElem, outputElem, endpoint) {
        const inputText = inputElem.value;
        const formData = new FormData();
        formData.append('text', inputText);
        const outputFormat = document.querySelector('#output-format').value;
        formData.append('output_format', outputFormat);
    
        fetch(endpoint, {
            method: 'POST',
            headers: {
                'X-CSRFToken': getCookie('csrftoken')
            },
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            let result = data.result;
            let instanceElem = document.createElement('div');
            instanceElem.classList.add('compiler-instance');
    
            if (result) {
                if (outputFormat === 'speech' && result.speech) {
                    instanceElem.innerHTML = `
                        <div class="compiler-input"><strong>Input Prompt:</strong><p>${inputText.replace(/\n/g, '<br>')}</p></div>
                        <div class="compiler-output"><strong>Text Output:</strong><p>${result.text.replace(/\n/g, '<br>')}</p></div>
                        <div class="compiler-output"><strong>Speech Output:</strong><audio controls src="${result.speech}"></audio></div>
                    `;
                } else if (outputFormat === 'image' && result.image) {
                    instanceElem.innerHTML = `
                        <div class="compiler-input"><strong>Input Prompt:</strong><p>${inputText.replace(/\n/g, '<br>')}</p></div>
                        <div class="compiler-output"><strong>Text Output:</strong><p>${result.text.replace(/\n/g, '<br>')}</p></div>
                        <div class="compiler-output"><strong>Image Output:</strong><img src="${result.image}" alt="Generated Image" style="max-width: 100%; height: auto;" /></div>
                    `;
                } else {
                    instanceElem.innerHTML = `
                        <div class="compiler-input"><strong>Input Prompt:</strong><p>${inputText.replace(/\n/g, '<br>')}</p></div>
                        <div class="compiler-output"><strong>Output:</strong><p>${result.replace(/\n/g, '<br>')}</p></div>
                    `;
                }
            } else {
                instanceElem.innerHTML = `
                    <div class="compiler-output"><strong>Error:</strong><p>Received an undefined result from the server.</p></div>
                `;
            }
    
            outputElem.insertBefore(instanceElem, outputElem.firstChild);
    
            // Hide placeholder message if messages are appended
            if (outputElem.children.length > 0) {
                const placeholder = outputElem.querySelector('.placeholder-message');
                if (placeholder) placeholder.style.display = 'none';
            }
        })
        .catch(error => {
            let instanceElem = document.createElement('div');
            instanceElem.classList.add('compiler-instance');
            instanceElem.innerHTML = `
                <div class="compiler-output"><strong>Error:</strong><p>${error.message.replace(/\n/g, '<br>')}</p></div>
            `;
            outputElem.insertBefore(instanceElem, outputElem.firstChild);
        });
    }
    

    function appendMessage(sender, text, outputElem) {
        const messageElem = document.createElement('div');
        messageElem.classList.add('message', sender);
        let messageHTML = text.replace(/\n/g, '<br>');
        if (outputFormatSelect.value === 'image' && sender === 'received') {
            messageHTML = `<iframe src="${text}" class="responsive-iframe" width="100%" height="400px"></iframe>
            `;
        }
        messageElem.innerHTML = `<p>${messageHTML}</p>`;
        outputElem.appendChild(messageElem);
        outputElem.scrollTop = outputElem.scrollHeight;

        // Hide placeholder message if messages are appended
        if (outputElem.children.length > 0) {
            const placeholders = outputElem.querySelectorAll('.placeholder-message');
            placeholders.forEach(placeholder => placeholder.style.display = 'none');
        }
    }

    // Function to dynamically expand the textarea
    chatbotInput.addEventListener('input', function () {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight) + 'px';
    });

    function saveInteraction(prompt, generatedOutput) {
        fetch('/save_interaction/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            },
            body: JSON.stringify({
                question: prompt,
                answer: generatedOutput,
                workspace_state: getWorkspaceState()
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                console.error('Error saving interaction:', data.error);
            } else {
                console.log('Interaction saved successfully');
            }
        })
        .catch(error => console.error('Error saving interaction:', error));
    }    

    // Function to load interaction and restore workspace state
    window.onInteractionClick = function(interactionId) {
        fetch(`/load_interaction/${interactionId}`)
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    console.error(data.error);
                    return;
                }

                // Populate the workspace with the saved state
                document.getElementById('user-input').value = data.question;
                editor.setValue(data.answer.replace(/\\n/g, '\n'));
                restoreWorkspaceState(data.workspace_state);
            })
            .catch(error => console.error('Error loading interaction:', error));
    };

    // Function to restore workspace state
    function restoreWorkspaceState(state) {
        if (state) {
            console.log("Restoring workspace state:", state);
        }
    }

    function getWorkspaceState() {
        return {
            editorContent: editor.getValue(),
            chatbotInput: document.getElementById('user-input').value
        };
    }

    // Function to stream response from the API
    window.streamResponse = function(inputText, workspaceState) {
        const eventSource = new EventSource(`/stream_response?text=${encodeURIComponent(inputText)}&workspace_state=${encodeURIComponent(JSON.stringify(workspaceState))}`);
        eventSource.onmessage = function(event) {
            const data = JSON.parse(event.data);
            document.getElementById('outputText').value += data.chunk;
        };
        eventSource.onerror = function() {
            eventSource.close();
        };
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

    // Copy prompt to clipboard
    copyPromptBtn.addEventListener('click', function () {
        navigator.clipboard.writeText(editor.getValue()).then(() => {
            alert('Prompt copied to clipboard!');
        });
    });

    // Resizable and collapsible panels
    function makePanelResizable(panel) {
        const resizerTop = document.createElement('div');
        resizerTop.className = 'resizer top';
        panel.appendChild(resizerTop);

        const resizerRight = document.createElement('div');
        resizerRight.className = 'resizer right';
        panel.appendChild(resizerRight);

        const resizerBottom = document.createElement('div');
        resizerBottom.className = 'resizer bottom';
        panel.appendChild(resizerBottom);

        const resizerLeft = document.createElement('div');
        resizerLeft.className = 'resizer left';
        panel.appendChild(resizerLeft);

        resizerTop.addEventListener('mousedown', initResize);
        resizerRight.addEventListener('mousedown', initResize);
        resizerBottom.addEventListener('mousedown', initResize);
        resizerLeft.addEventListener('mousedown', initResize);

        function initResize(e) {
            window.addEventListener('mousemove', resize);
            window.addEventListener('mouseup', stopResize);

            function resize(event) {
                if (e.target.classList.contains('right')) {
                    panel.style.width = (event.pageX - panel.getBoundingClientRect().left) + 'px';
                } else if ( e.target.classList.contains('left')) {
                    panel.style.width = (panel.getBoundingClientRect().right - event.pageX) + 'px';
                    panel.style.left = event.pageX + 'px';
                } else if (e.target.classList.contains('bottom')) {
                    panel.style.height = (event.pageY - panel.getBoundingClientRect().top) + 'px';
                } else if (e.target.classList.contains('top')) {
                    panel.style.height = (panel.getBoundingClientRect().bottom - event.pageY) + 'px';
                    panel.style.top = event.pageY + 'px';
                }
            }

            function stopResize() {
                window.removeEventListener('mousemove', resize);
                window.removeEventListener('mouseup', stopResize);
            }
        }
    }


    // Function to set example prompt
    window.setExamplePrompt = function (exampleText) {
        document.getElementById('user-input').value = exampleText;
    };

    // Add task
    addTaskBtn.addEventListener('click', function () {
        const taskText = newTaskInput.value.trim();
        if (taskText !== '') {
            const taskElem = document.createElement('li');
            taskElem.innerHTML = `${taskText} <button class="remove-task-btn">Remove</button>`;
            taskList.appendChild(taskElem);

            taskElem.querySelector('.remove-task-btn').addEventListener('click', function () {
                taskElem.remove();
            });

            newTaskInput.value = '';
        }
    });

    if ('webkitSpeechRecognition' in window) {
        const recognitionNexus = new webkitSpeechRecognition();
        const recognitionDebugger = new webkitSpeechRecognition();
        const recognitionCompiler = new webkitSpeechRecognition();

        recognitionNexus.continuous = false;
        recognitionNexus.interimResults = false;
        recognitionNexus.lang = 'en-US';

        recognitionNexus.onresult = function (event) {
            const transcript = event.results[0][0].transcript;
            chatbotInput.value += transcript;
        };

        recognitionNexus.onerror = function (event) {
            console.error(event.error);
        };

        voiceBtnNexus.addEventListener('click', function () {
            recognitionNexus.start();
        });

        recognitionDebugger.continuous = false;
        recognitionDebugger.interimResults = false;
        recognitionDebugger.lang = 'en-US';

        recognitionDebugger.onresult = function (event) {
            const transcript = event.results[0][0].transcript;
            document.querySelector('#user-input-debugger').value += transcript;
        };

        recognitionDebugger.onerror = function (event) {
            console.error(event.error);
        };

        voiceBtnDebugger.addEventListener('click', function () {
            recognitionDebugger.start();
        });

        recognitionCompiler.continuous = false;
        recognitionCompiler.interimResults = false;
        recognitionCompiler.lang = 'en-US';

        recognitionCompiler.onresult = function (event) {
            const transcript = event.results[0][0].transcript;
            document.querySelector('#user-input-compiler').value += transcript;
        };

        recognitionCompiler.onerror = function (event) {
            console.error(event.error);
        };

        voiceBtnCompiler.addEventListener('click', function () {
            recognitionCompiler.start();
        });

    } else {
        voiceBtnNexus.style.display = 'none';
        voiceBtnDebugger.style.display = 'none';
        voiceBtnCompiler.style.display = 'none';
    }

    // Handle Fine-Tune Prompt button click
    document.querySelector('#run-debugger').addEventListener('click', function () {
        sendMessage(chatbotInput, messages, '/debug/');
    });

    // Handle Test Prompt button click
    document.querySelector('#run-code').addEventListener('click', function () {
        sendMessage(chatbotInput, messages, '/compile/');
    });

    // Handle PromptTune Submit button click
    promptTuneSubmitBtn.addEventListener('click', function () {
        const inputElem = document.querySelector('#user-input-debugger');
        const outputElem = document.querySelector('#debugger-output');
        sendMessagePromptTune(inputElem, outputElem, '/debug/');
    });

    // Handle Virtuon Core Submit button click
    virtuonCoreSubmitBtn.addEventListener('click', function () {
        const inputElem = document.querySelector('#user-input-compiler');
        const outputElem = document.querySelector('#compiler-output');
        sendMessageVirtuonCore(inputElem, outputElem, '/compile/');
    });
    
});
