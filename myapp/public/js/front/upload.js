requirejs.config({
    baseUrl: 'js',
    paths: {
        jquery: 'jquery-1.8.3.min',
        webuploader: '../plugins/webuploader/webuploader',
        md5: 'md5.min',
    }
});

requirejs(['modules/uploader'], function (Uploader) {
    Uploader.init({
        pick: {
            id: '#picker',
            label: '选择文件'
        },
        threads: 2,
    });

    $('#ctlBtn').on('click', function (event) {
        event.stopPropagation();
        Uploader.startUpload();
    });
});
