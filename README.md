# express_fileupload

## Description
- Large file upload based on NodeJs, express framework and WebUploader plugins.
- Support slice of file uploading, merging and file downloading.

## Directory Description

- myapp: the main app directory created by express.
- upload: file upload directory including slice chunks and temporary directories.

## Usage

- Install NodeJs.
- Clone or download to the web root directory.
- Execute command(the default app port is `6888`):

```
cd myapp
DEBUG=myapp:* npm start
```

- Visit upload page（http://127.0.0.1:6888/upload）
