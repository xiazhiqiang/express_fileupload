var express = require('express');
var router = express.Router();

var multer = require('multer');
var fs = require('fs');
var url = require('url');
var md5 = require('md5');
var child_process = require('child_process');


/* GET home page. */
router.get('/', function (req, res, next) {
    res.render('index', {title: 'Express'});
});

// 文件加salt
var fileSalt = 'xxx';

// 文件上传
var uploadDir = __dirname + '/../../upload';// 上传目录
var tmpDir = [uploadDir, 'tmp'].join('/');// 上传临时目录
var chunkDir = [uploadDir, 'chunks'].join('/');// 分片目录

// 如果必要的文件上传目录不存在,则创建之
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, 0777);
}
if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir, 0777);
}
if (!fs.existsSync(chunkDir)) {
    fs.mkdirSync(chunkDir, 0777);
}

router.get('/upload', function (req, res, next) {
    res.render('front/upload', {title: 'Upload'});
})
    .post('/upload_process', multer({dest: uploadDir}).array('file'), function (req, res, next) {
        var responseJson = {
            origin_file: req.files[0]// 上传的文件信息
        };

        var src_path = req.files[0].path;
        var des_path = req.files[0].destination + req.files[0].originalname;

        fs.rename(src_path, des_path, function (err) {
            if (err) {
                throw err;
            }

            fs.stat(des_path, function (err, stat) {
                if (err) {
                    throw err;
                }

                responseJson['upload_file'] = stat;
                console.log(responseJson);

                return res.json(responseJson);
            });
        });

        console.log(responseJson);
    })
    // 上传分片
    .post('/upload_chunks', multer({dest: tmpDir}).array('file'), function (req, res, next) {
        var src_path = req.files[0].path;// 原始片段在临时目录下的路径
        var des_dir = [chunkDir, req.body.guid].join('/');
        var des_path = (req.body.chunk) ? [des_dir, req.body.chunk].join('/') : des_dir;

        // 如果没有des_dir目录,则创建des_dir
        if (!fs.existsSync(des_dir)) {
            fs.mkdirSync(des_dir);
        }

        // 移动分片文件到
        try {
            child_process.exec(['mv', src_path, des_path].join(' '), function (err, stdout, stderr) {
                if (err) {
                    console.log(err);

                    return res.json({'status': 0, 'msg': '移动分片文件错误!'});
                }

                return res.json({'status': 1, 'msg': req.body.guid + '_' + req.body.chunk + '上传成功!'});
            });
        } catch (e) {
            console.log(e);

            return res.json({'status': 0, 'msg': '移动分片文件错误!'});
        }

    })
    // 合并分片
    .post('/merge_chunks', function (req, res, next) {
        var src_dir = [chunkDir, req.body.hash + '/'].join('/');

        // 目标目录
        var time = new Date();
        var path = md5([
            time.getFullYear(),
            time.getMonth() + 1 <= 9 ? '0' + (time.getMonth() + 1) : time.getMonth() + 1,
            time.getDate <= 9 ? '0' + time.getDate() : time.getDate()
        ].join(''));// 文件目录名

        // 如果没有des_dir目录,则创建des_dir
        var des_dir = [uploadDir, path].join('/');
        if (!fs.existsSync(des_dir)) {
            fs.mkdirSync(des_dir);
        }

        // 文件名+扩展名
        var name = decodeURIComponent(req.body.name);

        // 文件的实际名称和路径
        var fileName = md5([path, name, req.body.size, new Date().getTime(), 99999 * Math.random()].join(fileSalt));

        // 文件签名
        var sig = md5([path, name, fileName, req.body.size].join(fileSalt));

        // 文件的实际路径
        var des_path = [des_dir, fileName].join('/');

        try {
            var files = fs.readdirSync(src_dir);

            if (files.length == 0) {
                return res.json({'status': 0, 'url': '', 'msg': '分片文件不存在!'});
            }

            if (files.length > 1) {
                files.sort(function (x, y) {
                    return x - y;
                });
            }

            for (var i = 0, len = files.length; i < len; i++) {
                fs.appendFileSync(des_path, fs.readFileSync(src_dir + files[i]));
            }

            // 删除分片文件夹
            child_process.exec(['rm', '-rf', src_dir].join(' '));

            return res.json({
                'status': 1,
                'url': [
                    'http://127.0.0.1:6888',
                    'file', fileName,
                    'path', path,
                    'name', encodeURIComponent(name),
                    'sig', sig
                ].join('/')
            });
        } catch (e) {
            // 删除分片文件夹
            child_process.exec(['rm', '-rf', src_dir].join(' '));

            return res.json({'status': 0, 'url': ''});
        }
    })
    // 文件获取
    .get('/file/:file/path/:path/name/:name/sig/:sig', function (req, res, next) {
        try {
            var name = decodeURIComponent(req.params.name);
            var stat = fs.statSync([uploadDir, req.params.path, req.params.file].join('/'));
            var sig = md5([req.params.path, name, req.params.file, stat.size].join(fileSalt));

            // 签名验证
            if (sig != req.params.sig) {
                return res.json({status: 0, msg: '签名错误!'});
            }

            res.download([uploadDir, req.params.path, req.params.file].join('/'), name, function (err) {
                if (err) {
                    return res.send('下载错误!');
                }
            });
        } catch (e) {
            return res.json({status: 0, msg: '未知错误!'});
        }
    });

// form相关
router.get('/form', function (req, res, next) {
    res.render('form', {'title': 'Form'});
}).post('/form_process', multer({dest: __dirname + '/../../upload/'}).array('file'), function (req, res, next) {
    var responseJson = {
        first_name: req.body.first_name,
        last_name: req.body.last_name,
        origin_file: req.files[0]// 上传的文件信息
    };

    var src_path = req.files[0].path;
    var des_path = req.files[0].destination + req.files[0].originalname;

    fs.rename(src_path, des_path, function (err) {
        if (err) {
            throw err;
        }

        fs.stat(des_path, function (err, stat) {
            if (err) {
                throw err;
            }

            responseJson['upload_file'] = stat;
            console.log(responseJson);

            res.json(responseJson);
        });
    });

    console.log(responseJson);
});

module.exports = router;
