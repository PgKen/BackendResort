var express = require("express");
var router = express.Router();

var moment = require("moment"); // require

var mysql = require("mysql");

var db_config = {
  host: "localhost",
  user: "root",
  password: "comp@113",
  //password: 'ken27@pg',
  database: "db_resort",
};

var conn;

function handleDisconnect() {
  conn = mysql.createConnection(db_config); // Recreate the connection, since
  // the old one cannot be reused.

  conn.connect(function (err) {
    // The server is either down
    if (err) {
      // or restarting (takes a while sometimes).
      console.log("error when connecting to db:", err);
      setTimeout(handleDisconnect, 2000); // We introduce a delay before attempting to reconnect,
    } // to avoid a hot loop, and to allow our node script to
  }); // process asynchronous requests in the meantime.
  // If you're also serving http, display a 503 error.
  conn.on("error", function (err) {
    console.log("db error", err);
    if (err.code === "PROTOCOL_CONNECTION_LOST") {
      // Connection to the MySQL server is usually
      handleDisconnect(); // lost due to either server restart, or a
    } else {
      // connnection idle timeout (the wait_timeout
      throw err; // server variable configures this)
    }
  });
}

handleDisconnect();

/* GET home page. */

router.get("/cms", (req, res) => {
  let sql = "SELECT * FROM users";
  conn.query(sql, (err, resp) => {
    // console.log(resp);
    res.send(resp);
  });
});

router.post("/chkUser", (req, res) => {
  let user = req.body.user;
  let password = req.body.password;
  console.log("user = " + user + " password = " + password);

  let sql = "SELECT * FROM users WHERE name = ? AND password = ?";
  conn.query(sql, [user, password], (err, resp) => {
    if (err) throw console.log(err);
    if (resp.length > 0) {
      res.send(resp);
    } else {
      res.send([
        {
          active: 0,
        },
      ]);
    }
  });
  // res.send(resp)
});

router.post("/addroom", (req, res) => {
  let data = req.body;
  // console.log(data);
  let type = req.body.type;
  if(type == null){
    type = 1
  }
  let name = req.body.name;
  let price = req.body.price;
  if(price == null){
    price = 0
  }
  let active = 1;
  conn.query(
    "INSERT INTO room (type,name,price,active)VALUE(?,?,?,?)",
    [type, name, price, active],
    (err, resp) => {
      if (err) throw console.log(err);
      res.send("ok");
    }
  );
});

router.get("/listRoom", (req, res) => {
  let mm = req.params.mm
  console.log("mm = " +mm);
  let sql = "SELECT * FROM room";
  conn.query(sql, (err, resp) => {
    if (err) throw console.log(err);
    res.send(resp);
  });
});

router.post("/booking", (req, res) => {
  let data = req.body;
  let namebooking = req.body.namebooking;
  let datebooking = req.body.datebooking;
  let rootid = req.body.rootid;
  console.log("datebooking = " +datebooking);
  console.log(data);

  async function main() {
    let a = await chkData();
  }
  main();

  function chkData(){
    let sql = "SELECT * FROM booking WHERE datebooking = ? AND idroom = ?"
    conn.query(sql,[datebooking,rootid],(err,resp)=>{
      if(err)throw console.log(err);
      if(resp.length > 0){
        console.log(resp);
        sendData();
      }else{
        console.log(resp);
        addData();
      }
    })
  }

  function addData() {
    let sql = "INSERT INTO booking(idroom,datebooking,name) VALUES(?,?,?)";
    conn.query(sql, [rootid, datebooking, namebooking], (err, resp) => {
      if (err) throw console.log(err);
      sendData();
    });
  }

  function sendData() {
    res.end();
  }
});

// databooking/03

router.get("/databooking/:nowmonth/:nowyear", (req, res) => {
  let data = [];
  let dataList = [];
  let roomData = []; // ห้อง
  let roomBooing = []; // booking ห้อง
  let mm = req.params.nowmonth;
  let yy = req.params.nowyear;
  mm = parseInt(mm)
  mm = mm +1
  console.log("mm = " + mm);
  let startdate = yy + "-" + mm + "-01";
  let enddate = yy + "-" + mm + "-31";

  let dateOfmonth = moment(startdate).daysInMonth();
  console.log("dateOfmonth = " + dateOfmonth);
  console.log("");
  async function main() {
    databooking();
  }
  main();

  function databooking() {
    // let datenow = moment().format("YYYY-MM-DD");
    // console.log("datenow = " + datenow);
    let sql = "SELECT * FROM booking WHERE datebooking BETWEEN ? AND ? ";
    console.log("funtion databooking");
    conn.query(sql, [startdate, enddate], (err, resp) => {
      // console.log(resp);
      data = resp;
      // if(resp.databooking)
      roomList();
    });
  }

  // list ห้อง
  function roomList() {
    async function main() {
      let a = await getRoomLength();
    }
    main();

    function getRoomLength() {
      let sql = "SELECT * FROM `room`";
      conn.query(sql, (err, resp) => {
        if (err) throw console.log(err);
        // console.log(resp);
        roomData = resp;
        listRoomData();
      });
    }

    function listRoomData() {
      let sql =
        "SELECT * FROM booking WHERE idroom = ? AND datebooking BETWEEN ? AND ?";
      for (let index = 0; index < roomData.length; index++) {
        roomBooing.push([]);
        conn.query(
          sql,
          [roomData[index].id, startdate, enddate],
          (err, resp) => {
            if (err) throw console.log(err);
            // console.log("----room----");
            // console.log(resp);
            if (resp.length > 0) {
              roomBooing[index].push(resp);
            } else {
              roomBooing[index].push([
                {
                  datebooking: null,
                  idBooking: null,
                  // name: null,
                },
              ]);

              //roomBooing[index].push(null);
              //roomBooing.push([]);
            }
            if (index == roomData.length - 1) {
              // mapArr();
              getDataOfDay();
            }
          }
        );
      }
    }
  }
  // end list ห้อง

  // ห้องทีมีการจอง มาวน วัน 31
  // function getDataOfDay(){
  //   for (let i = 1; i < dateOfmonth + 1; i++) {
  //     for (let r = 0; r < roomBooing.length; r++) {
  //       dataList.push([])
  //       for (let b = 0; b < roomBooing[r].length; b++) {
  //         if(i == parseInt(moment(roomBooing[r][b].databooking).format("DD"))){
  //           dataList[r].push(1)
  //         }else{
  //           dataList[r].push(0)
  //         }

  //       }
  //     }
  //     if(i == dateOfmonth){
  //       sendData();
  //     }
  //   }
  // }
  // end ห้องทีมีการจอง มาวน วัน 31

  // ห้องทีมีการจอง มาวน วัน 31
  function getDataOfDay() {
    // console.log(roomBooing[0][0][0].datebooking);
    // console.log(roomBooing[0][0].length);
    // console.log(roomData.length);
    // console.log("roomData length = " + roomData.length);
    // console.log(roomBooing[0]);

    for (let i = 0; i < roomData.length; i++) {
      dataList.push([]);
      for (let r = 0; r < dateOfmonth + 1; r++) {
        // console.log("day = " +r);
        dataList[i].push([]);
        dataList[i][r] = 0;
        // console.log("R =" + r);
        for (let b = 0; b < roomBooing[i][0].length; b++) {
          // console.log("B =" +b);
          // console.log("daY =" + moment(roomBooing[i][0][b].datebooking).format("DD"))
          // console.log("r= "+(r+1));
          if (roomBooing[i][0][b].datebooking == null) {
          } else {
            if (r + 1 == moment(roomBooing[i][0][b].datebooking).format("DD")) {
              // dataList[i][r] = 1;
              dataList[i][r] = {
                // roomBooing[i][0][b].name
                name: roomBooing[i][0][b].name,
                idBooking: roomBooing[i][0][b].id,
              };
              // console.log(
              //   "mm == " + moment(roomBooing[i][0][b].datebooking).format("DD")
              // );
            } else {
              // dataList[i][r] = {
              //   // roomBooing[i][0][b].name
              //   name: "",
              //   idBooking: "",
              // };
            }
          }
        }
      }
      if (i == roomData.length - 1) {
        sendData();
      }
    }
  }
  // end ห้องทีมีการจอง มาวน วัน 31

  // function addBooingArr() {
  //   let sql = "";
  // }

  // function mapArr() {
  //   console.log("map");
  //   console.log(data.length);
  //   console.log(moment(data[0].datebooking).format("MM"));

  //   for (let i = 1; i < dateOfmonth + 1; i++) {
  //     for (let d = 0; d < data.length; d++) {
  //       if (i == parseInt(moment(data[d].datebooking).format("DD"))) {
  //         // console.log(parseInt(moment(data[d].datebooking).format("DD")));
  //         dataList.push(1);
  //       } else {
  //         // console.log("no");
  //         dataList.push(0);
  //       }
  //     }
  //     if (i == dateOfmonth) {
  //       sendData();
  //     }
  //   }

  // }

  function sendData() {
    console.log("----data----");
    // console.log(roomBooing);
    // console.log(roomBooing.length);
    // console.log(roomBooing[2][0]);
    // console.log("จำนวนห้อง = "+roomLength);
    // console.log(dataList);
    // console.log(dataList.length);
    // roomBooing.forEach(el => {
    //   console.log(el.length);
    // });
    // console.log(roomBooing[4]);
    //console.log(data);
    res.send(dataList);
  }
});

// deteailBooking
router.get("/deteailBooking/:id", (req, res) => {
  console.log("-----data------");
  let data = [];
  async function main() {
   let a = await getData();
  }
  main();

  function getData() {
    let id = req.params.id;
    sql =
      "SELECT *,booking.name As namebooking,room.`name` As nameroom,booking.id As idbooking FROM booking INNER JOIN room ON booking.idroom = room.id WHERE booking.id = ?";
    conn.query(sql, [id], (err, resp) => {
      if (err) throw console.log(err);
      // console.log(resp);
      data = resp;
      mapData();
    });
  }

  function mapData() {
    let mData = data.map((item) => {
      return {
        idBooking : item.idbooking,
        id: item.id,
        namebooking: item.namebooking,
        nameroom: item.nameroom,
        datebooking: moment(item.datebooking).format("DD-MM-YYYY")
      };
    });
    data = mData
    sendData();
  }

  function sendData(){
    console.log("----");
    res.send(data);
  }
});

router.delete('/delBooking/:id',(req,res)=>{
  // console.log(req.params.id);
  let id = req.params.id
  let sql = "DELETE FROM booking WHERE id = ?"
  conn.query(sql,[id],(err,resp)=>{
    res.send('del ok')
  })
})

router.delete('/delroom/:id',(req,res)=>{
  let id = req.params.id

  async function main(){
     let a = await delBooking()
  }
  main();

  function delBooking(){
    let sql = "DELETE FROM booking WHERE idroom = ?"
    conn.query(sql,[id],(err,resp)=>{
      if(err) throw console.log(err);
      delroom();
    })
  }

  function delroom(){
    let sql = "DELETE FROM room WHERE id = ?"
    conn.query(sql,[id],(err,resp)=>{
      if(err) throw console.log(err);
      sendData();      
    })
  }

  function sendData(){
    res.send("Del Ok")
  }
  
})



module.exports = router;
