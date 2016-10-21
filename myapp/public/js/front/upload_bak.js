(function ($) {

    try {
        if (!WebUploader.Uploader.support()) {
            alert('Web Uploader 不支持您的浏览器！如果你使用的是IE浏览器，请尝试升级 flash 播放器');
            throw new Error('WebUploader does not support the browser you are using.');
        }
    } catch (e) {
        if (e instanceof Error) {
            console.error(e.message);
        } else {
            console.error('Error!');
        }

        return false;
    }

    var uploader = WebUploader.create({
        // 选完文件后，是否自动上传。
        auto: false,

        // swf文件路径
        swf: '../../webuploader/Uploader.swf',

        // 文件接收服务端。
        server: '/upload_chunks',

        // 选择文件的按钮。可选。
        // 内部根据当前运行是创建，可能是input元素，也可能是flash.
        pick: {
            id: '#picker',
            label: '点击选择文件'
        },

        // 配置压缩的图片的选项
        compress: false,

        // 拖拽配置
        dnd: '.dndArea',
        disableGlobalDnd: false,

        // 此功能为通过粘贴来添加截屏的图片。建议设置为document.body
        paste: document.body,

        // 分片上传配置
        chunked: true,// 开起分片上传。
        chunkSize: Math.pow(1024, 2),// 单位字节(Byte)
        threads: 1,//上传并发数

        // 不压缩image, 默认如果是jpeg，文件上传前会压缩一把再上传！
        resize: false
    });

    // 当有文件被添加进队列的时候
    uploader.on('fileQueued', function (file) {
        var $list = $(".uploader-list");

        var item = '<div id="' + file.id + '" class="item">' +
            '<div class="file-info">' +
            '<h4 class="info">' + file.name + '</h4>' +
            '<p class="state">等待上传...</p>' +
            '</div>' +
            '</div>';

        $list.append(item);
    });

    // 某个文件开始上传前触发,一个文件只触发一次
    uploader.on('uploadStart', function (file) {
        uploader.options.formData.guid = md5([file.id, file.name, file.size, file.type, file['__hash']].join(''));
    });

    // 文件上传过程中创建进度条实时显示。
    uploader.on('uploadProgress', function (file, percentage) {
        var $li = $('#' + file.id),
            $percent = $li.find('.progress .progress-bar');

        // 避免重复创建
        if (!$percent.length) {
            var progress = '<div class="progress progress-striped active">' +
                '<div class="progress progress-bar" role="progressbar" style="width: 0%">' +
                '</div>' +
                '</div>';

            $percent = $(progress).prependTo($li).find('.progress-bar');
        }

        $li.find('p.state').text('上传中');

        $percent.css('width', percentage * 100 + '%');
    });

    uploader.on('uploadSuccess', function (file) {
        console.log(file);

        // 如果是分片上传,文件上传成功后执行分片合并并返回Get文件的url
        if (uploader.options.chunked) {
            $.post('/merge_chunks', {
                'hash': md5([file.id, file.name, file.size, file.type, file['__hash']].join('')),
                'name': file.name,
                'size': file.size
            }, function (data) {
                if (data.status) {
                    $('#' + file.id).find('p.state').text('已上传');
                    $('#' + file.id).find('.progress-bar').css({
                        'background-image': 'url(' + data.url + ')',
                        'background-size': 'cover',
                        'background-repeat': 'no-repeat'
                    });
                } else {
                    $('#' + file.id).find('p.state').text('上传错误!');
                }
            }, 'json');
        }
    });

    uploader.on('uploadError', function (file) {
        $('#' + file.id).find('p.state').text('上传出错');
    });

    uploader.on('uploadComplete', function (file) {
        // $('#' + file.id).find('.progress').fadeOut();
    });

    $('#ctlBtn').on('click', function (event) {
        event.stopPropagation();
        uploader.upload();
    });

})(jQuery);
