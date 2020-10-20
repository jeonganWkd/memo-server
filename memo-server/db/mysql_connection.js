//promise로 개발된 mysql2패키치 설치하고 로딩
const mysql = require("mysql2");

//db-config.json에 저장된 중요 정보를 여기에 셋팅
const db_config = require("../config/db-config.json");

//connection pool 만들기(pool이 커넥션 연결을 자동으로 컨트롤 한다)
const pool = mysql.createPool({
  host: db_config.MYSQL_HOST,
  user: db_config.MYSQL_USER,
  database: db_config.DB_NAME,
  password: db_config.DB_PASSWD,
  waitForConnections: true,
  connectionLimit: 10,
});

//await으로 사용하기위해 promise로 저장
const connection = pool.promise();

module.exports = connection;

//error처리와 유지보수를 쉽게 할 수 있다
