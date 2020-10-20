const express = require("express");
const dotenv = require("dotenv");
const memo = require("./routes/memo");
const users = require("./routes/users");

//환경설정파일 로딩
dotenv.config({ path: "./config/config.env" });

const app = express();

//post 사용 시 body부분을 json으로 사용하겠다
app.use(express.json());

//메모처리부분
app.use("/api/v1/memos", memo);
//유저처리부분
app.use("/api/v1/users", users);

const PORT = process.env.PORT || 5100;

app.listen(PORT, console.log("App listening on port 5100!"));
