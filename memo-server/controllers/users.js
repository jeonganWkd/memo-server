//데이터베이스 연결
const connection = require("../db/mysql_connection");
//json web token 연결
const jwt = require("jsonwebtoken");

const bcrypt = require("bcrypt");
const validator = require("validator");
const sendMail = require("../utils/sendMail");

//@desc         회원가입
//@route        POST/api/v1/users
//@parameters   email, passwd
exports.createUser = async (req, res, next) => {
  //클라이언트로부터 이메일, 패스워드 받아서 변수로 생성
  let email = req.body.email;
  let passwd = req.body.passwd;

  //이메일 형식이 틀렸을 때
  if (validator.isEmail(email) == false) {
    res.status(400).json({ success: false });
    return; //리턴 꼭 해줘야함
  }
  //이메일이 정상일 때 비밀번호 단방향 암호화(hash)
  const hashedPasswd = await bcrypt.hash(passwd, 8);

  let query = "insert into memo_user (email, passwd) values (?, ?)";
  let data = [email, hashedPasswd];
  let user_id;

  try {
    [result] = await connection.query(query, data);
    user_id = result.insertId; //insert했으면 insert한 유저의 아이디값을 따온다
  } catch (e) {
    res.status(500).json({ success: false, error: e });
    return;
  }

  //토큰 생성(키값 : 받은 유저아이디, config에 저장해논 토큰이름 )
  const token = jwt.sign({ user_id: user_id }, process.env.AUTH_TOKEN_SECRET);

  //토큰 넣어서 저장
  query = "insert into memo_token (token, user_id) values (?,?)";

  data = [token, user_id];

  try {
    [result] = await connection.query(query, data);

    const message = "환영합니다";
    //회원가입 시 이메일 보내기
    try {
      await sendMail({
        email: "email",
        subject: "회원가입 츄카",
        message: message,
      });
      res.status(200).json({ success: true, token: token });
    } catch (e) {
      res.status(500).json({ success: false, error: e, message: "1" });
    }
  } catch (e) {
    res.status(500).json({ success: false, error: e, message: "2" });
  }
};

//로그인

//@desc         로그인
//@route        POST/api/v1/users/login
//@request      email, passwd
//@response     success, token

exports.loginUser = async (req, res, next) => {
  let email = req.body.email;
  let passwd = req.body.passwd;

  //이메일을 가져와서 비밀번호 확인
  let query = "select * from memo_user where email = ?";
  let data = [email];

  let user_id;

  try {
    [rows] = await connection.query(query, data);
    //이메일이 없는사람이 로그인 할 때
    if (rows.length == 0) {
      res.status(400).json({ success: false, message: "없는 이메일" });
      return;
    }

    //패스워드가 맞는지 확인
    const isMatch = await bcrypt.compare(passwd, rows[0].passwd);
    //비밀번호가 안맞을 때
    if (isMatch == false) {
      res.status(401).json({ success: false, message: "틀린 비밀번호" });
      return;
    }
    //비밀번호가 맞았을 때 유저아이디 가져오기
    user_id = rows[0].id;
    console.log(rows);
  } catch (e) {
    res.status(500).json({ success: false, error: e });
    return;
  }

  //뽑은 정보로 토큰 만들기
  let token = jwt.sign({ user_id: user_id }, process.env.AUTH_TOKEN_SECRET);
  console.log(user_id);
  query = "insert into memo_token (token, user_id) values(?,?)";
  data = [token, user_id];

  try {
    [result] = await connection.query(query, data);
    //회원가입이나 로그인은 token을 보내줘야한다
    res.status(200).json({ success: true, token: token });
    return;
  } catch (e) {
    res.status(500).json({ success: false, error: e });
    return;
  }
};

//@desc         내 정보 가져오는 api
//@url          GET/api/v1/users/me
//@request
//@response     id, email, created_at

exports.myInfo = (req, res, next) => {
  //auth라는 middleware를 통해 받는다
  //인증토큰 검증을 통과하여 이 함수로 온다

  let userInfo = req.user;
  res.status(200).json({ userInfo }); //userInfo가 json자체
};

//@desc            로그아웃api : DB에서 해당 유저의 현재 토큰값 삭제
//@route           POST/api/v1/users/logout
exports.logout = async (req, res, next) => {
  //토큰 테이블에서 현재 이 헤더에 있는 토큰으로 삭제
  let token = req.user.token;
  let user_id = req.user.id;

  let query = `delete from memo_token where user_id = ${user_id} and token = "${token}"`;

  try {
    [result] = await connection.query(query);
    //result를 res에 넣어서 클라이언트에 보낸다
    //포스트맨에서 삭제 api를 호출하여 무엇이 오는지 확인
    //affectedRows가 1이면 정상적으로 지워졌다
    if (result.affectedRows == 1) {
      res.status(200).json({ success: true });
      return;
    } else {
      //affectedRows가 1이 아니면 오류코드 보낸다
      res.status(400).json({ success: false });
    }
  } catch (e) {
    res.status(500).json({ success: false, error: e });
  }
};

//@desc         여러 단말기에 로그인하여 사용 시 전체 로그아웃 시키는 api
//@route        POST/api/v1/users/logoutAll

exports.logoutAll = async (req, res, next) => {
  let user_id = req.user.id;

  let query = `delete from memo_token where user_id = ${user_id}`;

  try {
    [result] = await connection.query(query);
    res.status(200).json({ success: true, massage: "logout" });
  } catch (e) {
    res.status(500).json({ success: false, error: e });
  }
};

//회원탈퇴

exports.deleteUser = async (req, res, next) => {
  let user_id = req.user.id;
  let query = `delete from memo_user where id = ${user_id}`;
  //트랜젝션 시작
  const conn = await connection.getConnection();
  try {
    await conn.beginTransaction();
    // 첫번째 테이블에서 정보 삭제
    [result] = await conn.query(query);
    // 두번째 테이블에서 정보 삭제
    query = `delete from memo_token where user_id = ${user_id}`;
    [result] = await conn.query(query);

    await conn.commit();
    res.status(200).json({ success: true });
  } catch (e) {
    await conn.rollback();
    res.status(500).json({ success: false, error: e });
  } finally {
    conn.release();
  }
};

//유저가 패스워드를 분실했을 때
//1. 클라이언트가 패스워드를 분실했다고 서버에게 요청
//   서버가 패스워드를 변경할 수 있는 url을 클라이언트에게 보내준다
//   경로에 암호화된 문자열은 보내준다(토큰역할)

//@desc     패스워드 분실
//@route    POST/api/v1/users/forgotpasswd
exports.forgotPasswd = async (req, res, next) => {
  let user = req.user;

  //암호화된 문자열 만들기
  const resetToken = crypto.randomBytes(20).toString("hex");
  const resetPasswdToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  //유저 테이블의 reset_passwd_token 컬럼에 저장
  let query = `update memo_user set reset_passwd_token = ? where id = ? `;
  let data = [resetPasswdToken, user.id];

  try {
    [reault] = await connection.query(query, data);
    user.reset_passwd_token = resetPasswdToken;
    res.status(200).json({ success: true, data: user });
  } catch (e) {
    res.status(500).json({ success: false, error: e });
  }
};

//2. 클라이언트는 해당 암호화된 주소를 받아 새로운 비밀번호를 서버로 보낸다
//   서버는 이 주소가 유효한지 확인하고 새로운 비밀번호로 셋팅한다

//@desc         리셋 패드워드 토큰을 경로로 만들어서 변경할 패스워드와 함께 요청
//              패스워드 초기화(reset passwd api)
//@route        POST/api/v1/users/resetPasswd/:resetPasswdToken
//@req          passwd

exports.resetPasswd = async (req, res, next) => {
  const resetPasswdToken = req.params.resetPasswdToken;
  const user_id = req.user.id;

  let query = "select * from memo_user where id = ?";
  let data = [user_id];

  try {
    [rows] = await connection.query(query, data);
    savedResetPasswdToken = rows[0].reset_passwd_token;
    console.log(rows);
    if (savedResetPasswdToken !== resetPasswdToken) {
      res.status(400).json({ success: false, message: "1" });
      return;
    }
  } catch (e) {
    res.status(500).json({ success: false, error: e });
    return;
  }

  //이상 없을 시 암호화 된 비밀번호를 db에 저장

  let passwd = req.body.passwd;

  const hashedPasswd = await bcrypt.hash(passwd, 8);
  query =
    "update memo_user set passwd = ? , reset_passwd_token = '' where id = ?";
  data = [hashedPasswd, user_id];

  delete req.user.reset_passwd_token;

  try {
    [result] = await connection.query(query, data);
    res.status(200).json({ success: true, data: req.user });
    return;
  } catch (e) {
    res.status(500).json({ success: false, error: e });
  }
};
