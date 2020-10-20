const jwt = require("jsonwebtoken");
const connection = require("../db/mysql_connection");

const auth = async (req, res, next) => {
  let token;
  //토큰 가져오고(reqest-header-authorization에 들어있다), Bearer 없애기

  try {
    token = req.header("Authorization").replace("Bearer ", "");
  } catch (e) {
    //토큰이 없는 경우
    res.status(401).json({ error: "인증하세요9" });
    console.log(token);
    return;
  }
  //유저 아이디와 토큰으로 db에 저장되있는 유효한 유저인지 체크
  const decoded = jwt.verify(token, process.env.AUTH_TOKEN_SECRET);
  //jwt.sign할 때 키값을 user_id로 저장했으므로 빼올때도 똑같이 작성=decoded.user_id
  let user_id = decoded.user_id;

  let query =
    "select * \
  from memo_token as mt \
  join memo_user as mu \
  on mt.user_id = mu.id \
  where mt.user_id = ? and mt.token = ? ";

  let data = [user_id, token];
  try {
    [rows] = await connection.query(query, data);

    //query를 날렸는데 data가 없을때
    if (rows.length == 0) {
      res.status(401).json({ error: "인증하세요8" });
    } else {
      //정상일 때 유저정보 셋팅
      req.user = rows[0];
      req.user.token = token;
      console.log(rows);
      next();
    }
  } catch (e) {
    res.status(401).json({ error: "인증하세요6" });
  }
};

module.exports = auth;
