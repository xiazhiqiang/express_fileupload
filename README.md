# express_fileupload

## Discription
- Large file upload based on nodejs, express framework and webuploader plugins.
- Support slice of file uploading, merging and file downloading.

## Directory Discription

- myapp: the main app directory created by express.
- upload: file upload directory including slice chunks and tempory directories.

## Usage

- Install nodejs.
- Clone or download to the webroot directory.
- Execute command(the default app port is `6888`):

```
cd myapp
DEBUG=myapp:* npm start
```

- Visit upload page（http://127.0.0.1:6888/upload）
