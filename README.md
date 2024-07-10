# myNexus IDE

myNexus IDE is an open-source Integrated Development Environment (IDE) designed for prompt engineering, leveraging advanced natural language processing, quantum-inspired computational models, and deep learning.

## Features

- **Unified Workspace**: Integrates all steps of the workflow in a single interface.
- **Rich Text and Code Editing**: Includes syntax highlighting, auto-suggestions, and error checking.
- **File Handling**: Drag-and-drop interface with file preview.
- **Real-Time Feedback and Debugging**: Provides instant feedback and suggestions as users type their prompts.
- **Customization and Control**: Save and reuse prompt templates with customizable settings.
- **Multi-Format Outputs**: Support for text, image, and speech outputs.
- **Scalability and Performance**: Efficient backend and scalable infrastructure.

## Prerequisites

- Python (version 3.8 or later)
- Node.js (for front-end development)
- Conda (for environment management)

## Installation

1. **Clone the repository**:
    ```sh
    git clone https://github.com/your-username/myNexus.git
    cd myNexus
    ```

2. **Create and activate a conda environment**:
    ```sh
    conda init zsh
    conda create --name aql --file requirements.txt
    conda activate aql
    ```

3. **Set up the OpenAI API key and Django secret key**:
    - Open the `settings.py` file located in the `promptantics/` directory.
    - Replace the placeholder secret key with your own key.
        ```python
        SECRET_KEY = "your-django-secret-key"
        ```
    - Open the `views.py` file located in the `nexus/` directory.
    - Replace the placeholder API key with your own key.
        ```python
        SECRET_KEY = "your-django-secret-key"
        ```

4. **Apply migrations and run the server**:
    ```sh
    python manage.py migrate
    python manage.py runserver
    ```

5. **Access the IDE at**: [http://127.0.0.1:8000/](http://127.0.0.1:8000/)

## Usage

1. **Upload Files**: Drag and drop files into the upload zone or click to select files.
2. **Prompt Development**: Write and edit prompts in the rich text editor.
3. **Generate Outputs**: Click "Develop" to generate text, image, or speech outputs.
4. **Debug Prompts**: Use the debug tool to refine and optimize your prompts.
5. **Save and Reuse**: Save your work for future use and leverage customizable settings for different AI models.

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgements

- [OpenAI](https://www.openai.com/) for their amazing APIs.
- [Django](https://www.djangoproject.com/) for the web framework.
- [CodeMirror](https://codemirror.net/) for the code editor.

## Video Demo

Check out our video demo to see myNexus IDE in action:

[![myNexus IDE Demo](https://img.youtube.com/vi/bl9yV0EJCEI/maxresdefault.jpg)](https://youtu.be/bl9yV0EJCEI)
