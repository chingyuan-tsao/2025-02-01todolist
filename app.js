/* 步驟一：測試 終端機輸入node app.js後，要出現hello
console.log('hello'); */

/* 步驟二：透過 createServer 開啟伺服器 */
//使用 require 函式引入 Node.js 的內建 http 模組，用於建立 HTTP 伺服器。
//http 模組提供了功能來處理網頁伺服器的請求和回應。 
const http = require('http'); //使用 node.js 內建的 http 模組
const { v4: uuidv4 } = require('uuid'); //使用外部的 npm 套件模組
const errHandle = require('./errorHandle'); //自行製作一個 module 模組
const todos = [];

//requestListener用來處理伺服器每次接收到的請求
const requestListener = (req, res)=>{
    //重複的部分都用宣告變數來處理
    const headers = {
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, Content-Length, X-Requested-With',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'PATCH, POST, GET,OPTIONS,DELETE',
        'Content-Type': 'application/json'
    }

    //接收 POST API 的 body 資料
    //當客戶端發送大量資料（例如：POST 請求傳送 JSON、表單資料或上傳檔案），這些資料可能是分批 (chunked) 傳送的，因此我們需要：
    // 1.監聽資料的接收 (req.on('data'))。
    // 2.在所有資料接收完成後 (req.on('end')) 處理完整的請求。
    let body = ""; //用來儲存請求的 body
    req.on('data', chunk=>{
        // console.log(chunk)
        body += chunk; //逐步接收請求資料
    })
    
    //設定首頁(http://127.0.0.1:3005/)看到index，不是首頁(如：http://127.0.0.1:3005/123456)會看到not found 404
    if(req.url=='/todos' && req.method=='GET'){ //GET：所有 todo
        //200：表示 HTTP 狀態碼「成功」
        //{"Content-Type": "text/plain"}：瀏覽器會根據這裡的格式來渲染畫面，告訴客戶端回應的內容類型是純文字。
        res.writeHead(200,headers);
        //客戶端接收到的內容，因為需透過JSON格式傳送資料，所以要用下面的寫法
        //JSON.stringify 用JSON格式以字串方式回傳
        res.write(JSON.stringify({
            "status":"success",
            "data":todos,
        }));
        //結束回應，通知伺服器不再向客戶端傳遞任何資料
        res.end();
       
    }else if(req.url=='/todos' && req.method=='POST'){ //POST：新增 todo
        req.on('end', ()=>{
            //透過 try catch 判斷 req.body 是否為 JSON 格式
            //JSON.parse(body)：將 JSON 字串轉換為 JavaScript 物件。
            //.title：從解析後的物件中取出 title 欄位。
            //如果 body 不是 JSON 格式，JSON.parse() 會拋出錯誤，所以通常會用 try...catch 來處理。
            try{
                //解析 JSON 字串 body，將其轉換成 JavaScript 物件 (Object)。
                //進入 try 或 catch 是由這一行來判斷
                const title = JSON.parse(body).title; 
                // console.log(JSON.parse(body));
                // console.log(title);

                //透過 if 判斷物件是否有 title 屬性
                if(title !== undefined){
                    //將資料加入 todos 陣列
                    const todo = {
                        "title":title,
                        "id":uuidv4()
                    };
                    todos.push(todo);
                    // console.log(todo);
    
                    res.writeHead(200,headers);
                    res.write(JSON.stringify({
                        "status":"success",
                        "data":todos,
                    }));
                    res.end();
                }else{
                    errHandle(res, headers) 
                }    
            }catch(error){
                errHandle(res, headers)
            }
        })
             
    }else if(req.url=='/todos' && req.method=='DELETE'){ //DELETE：刪除全部 todo 
        todos.length = 0; //刪除全部 todo
        res.writeHead(200,headers);
        res.write(JSON.stringify({
            "status":"success",
            "data":todos,
        }));
        res.end();
      
    }else if(req.url.startsWith("/todos/") && req.method == "DELETE"){ //DELETE：刪除單筆 todo
        //.split('/')把字串 依 / 分割成陣列
        //.pop() 會移除並回傳陣列的最後一個元素
        const id = req.url.split('/').pop();
        //element 是指目前的物件(post進去的資料)
        const index = todos.findIndex(element => element.id == id);
        console.log(id,index);

        //index顯示-1表示目前的物件裡面沒有這組id
        if(index !== -1){
            //.splice(index,1)移除從index開始算的第一筆資料
            todos.splice(index,1);
            res.writeHead(200,headers);
            res.write(JSON.stringify({
            "status":"success",
            "data":todos,
            }));
            res.end();
        }else{
            errHandle(res, headers)
        }

        

        
    }else if(req.url.startsWith("/todos/") && req.method == "PATCH"){ //PATCH：修改單筆 todo
        //等待 req.body 接收完成，透過 on('end') 觸發
        req.on('end',()=>{
            //req.body 是否為 JSON 格式
            try{
                const todo = JSON.parse(body).title; 
                //todo ID 是否存在
                const id = req.url.split('/').pop(); 
                const index = todos.findIndex(element => element.id == id);

                if(todo !== undefined && index !== -1){
                    todos[index].title = todo; //更新 todos 裡面第 index 筆的 title 資料
                    res.writeHead(200,headers);
                    res.write(JSON.stringify({
                    "status":"success",
                    "data":todos,
                    }));
                    res.end();
                }else{
                    errHandle(res, headers);
                }
            }catch{
                errHandle(res, headers);
            }
        })
    }else{
        res.writeHead(404,headers); //建立 404：無對應路由
        res.write(JSON.stringify({
            "status":"false",
            "message":"無此網站路由",
        }));
        res.end();
    }
}

//server.listen(3005) 啟動伺服器，並監聽本地電腦的 3005 埠 (Port)。這樣客戶端可以透過 http://localhost:3005 存取伺服器。 
const server = http.createServer(requestListener);
server.listen(process.env.PORT || 3005); //render雲端主機服務專用寫法

/* 步驟三：終端機輸入node app.js，網址輸入127.0.0.1:3005或是localhost:3005，網頁會出現hello123465 */
