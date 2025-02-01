
//try catch 的 catch 載入時使用
//需要引入 res headers 兩個參數資料
function errorHandle(res, headers){
    res.writeHead(400,headers);
    res.write(JSON.stringify({
    "status":"false",
    "message":"格式錯誤(13131)",
    }));
    res.end()
}

module.exports = errorHandle;