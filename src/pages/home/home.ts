import { Component } from '@angular/core';
import { NavController, LoadingController, Platform, ToastController, AlertController } from 'ionic-angular';
import { HttpHeaders } from "@angular/common/http";
import { ApiProvider } from '../../providers/api/api';
import moment from 'moment';
import { Storage } from '@ionic/storage';

declare var Email;
declare var gapi;
declare var html2json;
declare var json2html;

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {
  public channels = [];
  public channelstemp = [];
  public datetimecurrent: any;
  public channellist = [];
  public channellistplaylist = [];
  public channellistplaylistitems = [];
  public datalist = [];
  public ip: any;

  constructor(
    public toastCtrl: ToastController,
    public navCtrl: NavController,
    public api: ApiProvider,
    public loadingCtrl: LoadingController,
    public platform: Platform,
    public alertCtrl: AlertController,
    private storage: Storage) {
    this.doGetLocation()
    setInterval(() => {
      this.doGetUrlUseeTV()
    }, 1800000);
    /*setInterval(() => {
      this.doGet();
    }, 600000);*/
    /*setInterval(() => {
      this.doGetTruck();
    }, 10000);*/
    setInterval(() => {
      this.doGetChannelTemp()
    }, 180000);
    /*setInterval(() => {
      this.doGetUrl();
    }, 90000);
    setInterval(() => {
      this.doGetDataAsianGames2018();
    }, 300000);*/
    /*this.doGetChannel();*/
  }
  doGetLocation() {
    var self = this;
    this.readTextFileJSON('http://ip-api.com/json', function (text) {
      var data = JSON.parse(text);
      self.api.get("table/z_ip_access", { params: { limit: 1000, filter: "ip=" + "'" + data.query + "' AND status = 'OPEN'" } })
        .subscribe(val => {
          let data = val['data']
          if (data.length != 0) {
            self.ip = 'OK'
          }
          else {
            self.ip = 'BLOCK'
          }
        });
    });
  }
  ngAfterViewInit() {
    gapi.load("client:auth2", function () {
      gapi.auth2.init({ client_id: '79369072935-51pherm79l1k3lra5dt9pu3l18e9v2vf.apps.googleusercontent.com' });
    });
  }
  doGetChannelTemp() {
    this.channelstemp = [];
    this.api.get("table/z_channel_live_temp", { params: { limit: 1000, filter: "status='OPEN'" } })
      .subscribe(val => {
        let data = val['data'];
        for (let i = 0; i < data.length; i++) {
          let dataarray = data[i]
          this.datetimecurrent = moment().format('YYYY-MM-DD HH:mm');
          if (this.datetimecurrent > moment(dataarray.datetime_start).format('YYYY-MM-DD HH:mm') && dataarray.status_update == 0) {
            this.doGetLinkChannelTemp(dataarray);
          }
          if (this.datetimecurrent > moment(dataarray.datetime_end).format('YYYY-MM-DD HH:mm')) {
            this.doClsdChannelLive(dataarray);
          }
        }
      });
  }
  doGetLinkChannelTemp(dataarray) {
    var self = this
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function () {
      if (xhr.readyState == XMLHttpRequest.DONE) {
        if (xhr.status == 200) {
          var str = xhr.responseText
          var startparam = str.search('<video src="')
          var endparam = str.search('" controls=""')
          var urlvideo = str.substring(startparam + 12, endparam)
          self.doUpdateChannelLive(dataarray, urlvideo)
        } else {
          self.doGetLinkChannelTemp(dataarray)
        }
      }
    }
    xhr.onerror = function () {

    };
    xhr.open('GET', dataarray.url, true);
    xhr.send(null);
  }
  doUpdateChannelLive(dataarray, urlvideo) {
    const headers = new HttpHeaders()
      .set("Content-Type", "application/json");
    this.api.put("table/z_channel_live",
      {
        "id": dataarray.id_channel,
        "stream": '0',
        "plugin": '1',
        "exo": '1',
        "url": urlvideo,
      },
      { headers })
      .subscribe(val => {
        const headers = new HttpHeaders()
          .set("Content-Type", "application/json");
        this.api.put("table/z_channel_live_temp",
          {
            "id": dataarray.id,
            "status_update": 1,
          },
          { headers })
          .subscribe(val => {
          });
        let dateupdate = moment().format('YYYY-MM-DD HH:mm');
        var datetime = moment(dataarray.datetime_start).format('DD-MM-YYYY HH:mm')
        var titleemail = [
          dataarray.name + " : " + datetime
        ]
        Email.send("omegamediastreaming@gmail.com",
          "ajidwip6@gmail.com",
          titleemail,
          "",
          "smtp.gmail.com",
          "omegamediastreaming@gmail.com",
          "Utadahikaru227",
          function done(message) {
            console.log(message)
          });
        console.log('update sukses ', dateupdate)
      }, (err) => {
        this.doGetChannelTemp();
      });
    this.api.get("table/z_channel_live_url", { params: { limit: 1, filter: "id_channel=" + "'" + dataarray.id_channel + "'", sort: "id" + " ASC " } })
      .subscribe(val => {
        let data = val['data'];
        this.api.put("table/z_channel_live_url",
          {
            "id": data[0].id,
            "stream": '0',
            "plugin": '1',
            "exo": '1',
            "url": urlvideo,
          },
          { headers })
          .subscribe(val => {
            const headers = new HttpHeaders()
              .set("Content-Type", "application/json");
            this.api.put("table/z_channel_live_temp",
              {
                "id": dataarray.id,
                "status_update": 1,
              },
              { headers })
              .subscribe(val => {
              });
            let dateupdate = moment().format('YYYY-MM-DD HH:mm');
            var datetime = moment(dataarray.datetime_start).format('DD-MM-YYYY HH:mm')
            var titleemail = [
              dataarray.name + " : " + datetime
            ]
            Email.send("omegamediastreaming@gmail.com",
              "ajidwip6@gmail.com",
              titleemail,
              "",
              "smtp.gmail.com",
              "omegamediastreaming@gmail.com",
              "Utadahikaru227",
              function done(message) {
                console.log(message)
              });
            console.log('update sukses ', dateupdate)
          }, (err) => {
            this.doGetChannelTemp();
          });
      });
  }
  doClsdChannelLive(dataarray) {
    const headers = new HttpHeaders()
      .set("Content-Type", "application/json");
    this.api.put("table/z_channel_live",
      {
        "id": dataarray.id_channel,
        "status": 'CLSD',
      },
      { headers })
      .subscribe(val => {
        const headers = new HttpHeaders()
          .set("Content-Type", "application/json");
        this.api.put("table/z_channel_live_temp",
          {
            "id": dataarray.id,
            "status": 'CLSD',
          },
          { headers })
          .subscribe(val => {
          });
        let dateupdate = moment().format('YYYY-MM-DD HH:mm');
        var titleemail = [
          "Finish " + dataarray.name
        ]
        Email.send("omegamediastreaming@gmail.com",
          "ajidwip6@gmail.com",
          titleemail,
          "",
          "smtp.gmail.com",
          "omegamediastreaming@gmail.com",
          "Utadahikaru227",
          function done(message) {
            console.log(message)
          });
        console.log('clsd sukses ', dateupdate)
      }, (err) => {
        this.doGetChannelTemp();
      });
    this.api.get("table/z_channel_live_url", { params: { limit: 1, filter: "id_channel=" + "'" + dataarray.id_channel + "'", sort: "id" + " ASC " } })
      .subscribe(val => {
        let data = val['data'];
        this.api.put("table/z_channel_live_url",
          {
            "id": data[0].id,
            "status": 'CLSD',
          },
          { headers })
          .subscribe(val => {
            const headers = new HttpHeaders()
              .set("Content-Type", "application/json");
            this.api.put("table/z_channel_live_temp",
              {
                "id": dataarray.id,
                "status": 'CLSD',
              },
              { headers })
              .subscribe(val => {

              });
            let dateupdate = moment().format('YYYY-MM-DD HH:mm');
            var titleemail = [
              "Finish " + dataarray.name
            ]
            Email.send("omegamediastreaming@gmail.com",
              "ajidwip6@gmail.com",
              titleemail,
              "",
              "smtp.gmail.com",
              "omegamediastreaming@gmail.com",
              "Utadahikaru227",
              function done(message) {
                console.log(message)
              });
            console.log('clsd sukses ', dateupdate)
          }, (err) => {
            this.doGetChannelTemp();
          });
      });
  }
  doGetChannel() {
    this.channels = [];
    this.api.get("table/z_channel", { params: { limit: 1000, filter: "name='Premium TV'" } })
      .subscribe(val => {
        this.channels = val['data']
      });
  }
  doGet() {
    this.api.get("table/z_premium", { params: { limit: 1000, filter: "status='OPEN' AND link IS NULL" } })
      .subscribe(val => {
        let data = val['data'];
        console.log(data)
        for (let i = 0; i < data.length; i++) {
          let dataarray = data[i]
          /*let loader = this.loadingCtrl.create({
            // cssClass: 'transparent',
            content: 'Get ' + data[i].name + " Channel"
          });*/
          /*loader.present().then(() => {*/
          this.doGetLink(dataarray)
          if (i == (data.length - 1)) {
            this.doGetChannel();
          }
          /*loader.dismiss();
        });*/
        }
      });
  }
  doGetLinkAnime2() {
    this.api.get("table/z_channel_stream_detail_url", { params: { limit: 10000, filter: "status='OPEN' AND url LIKE '%anoboy%' AND stream = '1'" } })
      .subscribe(val => {
        let data = val['data'];
        for (let i = 0; i < data.length; i++) {
          let dataarray = data[i]
          /*let loader = this.loadingCtrl.create({
            // cssClass: 'transparent',
            content: 'Get ' + data[i].name + " Channel"
          });*/
          /*loader.present().then(() => {*/
          this.doGetLinkUrlAnime2(dataarray)
          if (i == (data.length - 1)) {

          }
          /*loader.dismiss();
        });*/
        }
      });
  }
  doGetLinkUrlAnime2(dataarray) {
    var selfurl = this
    var url = dataarray.url
    var xhrurl = new XMLHttpRequest();
    xhrurl.onreadystatechange = function () {
      if (xhrurl.readyState == XMLHttpRequest.DONE) {
        var urlresult = xhrurl.responseText.substring(1750, 1928)
        xhrurl.onload = () => {
          const headers = new HttpHeaders()
            .set("Content-Type", "application/json");
          selfurl.api.put("table/z_channel_stream_detail_url",
            {
              "id": dataarray.id,
              "url_anime": urlresult
            },
            { headers })
            .subscribe(val => {

            }, err => {
              const headers = new HttpHeaders()
                .set("Content-Type", "application/json");
              selfurl.api.put("table/z_channel_stream_detail_url",
                {
                  "id": dataarray.id,
                  "url_anime": urlresult
                },
                { headers })
                .subscribe(val => {

                }, err => {
                  console.log('error')
                })
            })
        }
      }
    }
    xhrurl.open('GET', url, true);
    xhrurl.send(null);
  }
  doGetLinkAnime() {
    console.log('1')
    this.api.get("table/z_channel_stream_detail", { params: { limit: 10000, filter: "status='OPEN' AND url LIKE '%anoboy%' AND url_anime IS NULL AND stream = '0' AND xml = ''" } })
      .subscribe(val => {
        let data = val['data'];
        console.log(data)
        for (let i = 0; i < data.length; i++) {
          let dataarray = data[i]
          /*let loader = this.loadingCtrl.create({
            // cssClass: 'transparent',
            content: 'Get ' + data[i].name + " Channel"
          });*/
          /*loader.present().then(() => {*/
          this.doGetLinkUrlAnime(dataarray)
          if (i == (data.length - 1)) {

          }
          /*loader.dismiss();
        });*/
        }
      });
  }
  doGetLinkUrlAnime(dataarray) {
    var selfurl = this
    var url = dataarray.url
    var xhrurl = new XMLHttpRequest();
    xhrurl.onreadystatechange = function () {
      if (xhrurl.readyState == XMLHttpRequest.DONE) {
        var heada = xhrurl.responseText.substring(2264 + 1, 2269 + 1)
        var headb = xhrurl.responseText.substring(2264 + 2, 2269 + 2)
        var headc = xhrurl.responseText.substring(2264 + 3, 2269 + 3)
        var headd = xhrurl.responseText.substring(2264 + 4, 2269 + 4)
        var heade = xhrurl.responseText.substring(2264 + 5, 2269 + 5)
        var headf = xhrurl.responseText.substring(2264 + 6, 2269 + 6)
        var headg = xhrurl.responseText.substring(2264 + 7, 2269 + 7)
        var headh = xhrurl.responseText.substring(2264 + 8, 2269 + 8)
        var headi = xhrurl.responseText.substring(2264 + 9, 2269 + 9)
        var headj = xhrurl.responseText.substring(2264 + 10, 2269 + 10)
        var headk = xhrurl.responseText.substring(2264 - 1, 2269 - 1)
        var headl = xhrurl.responseText.substring(2264 - 2, 2269 - 2)
        var headm = xhrurl.responseText.substring(2264 - 3, 2269 - 3)
        var headn = xhrurl.responseText.substring(2264 - 4, 2269 - 4)
        var heado = xhrurl.responseText.substring(2264 - 5, 2269 - 5)
        var headp = xhrurl.responseText.substring(2264 - 6, 2269 - 6)
        var headq = xhrurl.responseText.substring(2264 - 7, 2269 - 7)
        var headr = xhrurl.responseText.substring(2264 - 8, 2269 - 8)
        var heads = xhrurl.responseText.substring(2264 - 9, 2269 - 9)
        var headt = xhrurl.responseText.substring(2264 - 10, 2269 - 10)
        var head1 = xhrurl.responseText.substring(2264 - 11, 2269 - 11)
        var head2 = xhrurl.responseText.substring(2264 - 12, 2269 - 12)
        var head3 = xhrurl.responseText.substring(2264 - 13, 2269 - 13)
        var head4 = xhrurl.responseText.substring(2264 - 14, 2269 - 14)
        var head5 = xhrurl.responseText.substring(2264 - 15, 2269 - 15)
        var head6 = xhrurl.responseText.substring(2264 - 16, 2269 - 16)
        var head7 = xhrurl.responseText.substring(2264 - 17, 2269 - 17)
        var head8 = xhrurl.responseText.substring(2264 - 18, 2269 - 18)
        var head9 = xhrurl.responseText.substring(2264 - 19, 2269 - 19)
        var head10 = xhrurl.responseText.substring(2264 - 20, 2269 - 20)
        var head11 = xhrurl.responseText.substring(2264 - 21, 2269 - 21)
        var head12 = xhrurl.responseText.substring(2264 - 22, 2269 - 22)
        var head13 = xhrurl.responseText.substring(2264 - 23, 2269 - 23)
        var head14 = xhrurl.responseText.substring(2264 - 24, 2269 - 24)
        var head15 = xhrurl.responseText.substring(2264 - 25, 2269 - 25)
        var head16 = xhrurl.responseText.substring(2264 - 26, 2269 - 26)
        var bodya = xhrurl.responseText.substring(2269 + 1, 2333 + 1)
        var bodyb = xhrurl.responseText.substring(2269 + 2, 2333 + 2)
        var bodyc = xhrurl.responseText.substring(2269 + 3, 2333 + 3)
        var bodyd = xhrurl.responseText.substring(2269 + 4, 2333 + 4)
        var bodye = xhrurl.responseText.substring(2269 + 5, 2333 + 5)
        var bodyf = xhrurl.responseText.substring(2269 + 6, 2333 + 6)
        var bodyg = xhrurl.responseText.substring(2269 + 7, 2333 + 7)
        var bodyh = xhrurl.responseText.substring(2269 + 8, 2333 + 8)
        var bodyi = xhrurl.responseText.substring(2269 + 9, 2333 + 9)
        var bodyj = xhrurl.responseText.substring(2269 + 10, 2333 + 10)
        var bodyk = xhrurl.responseText.substring(2269 - 1, 2333 - 1)
        var bodyl = xhrurl.responseText.substring(2269 - 2, 2333 - 2)
        var bodym = xhrurl.responseText.substring(2269 - 3, 2333 - 3)
        var bodyn = xhrurl.responseText.substring(2269 - 4, 2333 - 4)
        var bodyo = xhrurl.responseText.substring(2269 - 5, 2333 - 5)
        var bodyp = xhrurl.responseText.substring(2269 - 6, 2333 - 6)
        var bodyq = xhrurl.responseText.substring(2269 - 7, 2333 - 7)
        var bodyr = xhrurl.responseText.substring(2269 - 8, 2333 - 8)
        var bodys = xhrurl.responseText.substring(2269 - 9, 2333 - 9)
        var bodyt = xhrurl.responseText.substring(2269 - 10, 2333 - 10)
        var body1 = xhrurl.responseText.substring(2269 - 11, 2333 - 11)
        var body2 = xhrurl.responseText.substring(2269 - 12, 2333 - 12)
        var body3 = xhrurl.responseText.substring(2269 - 13, 2333 - 13)
        var body4 = xhrurl.responseText.substring(2269 - 14, 2333 - 14)
        var body5 = xhrurl.responseText.substring(2269 - 15, 2333 - 15)
        var body6 = xhrurl.responseText.substring(2269 - 16, 2333 - 16)
        var body7 = xhrurl.responseText.substring(2269 - 17, 2333 - 17)
        var body8 = xhrurl.responseText.substring(2269 - 18, 2333 - 18)
        var body9 = xhrurl.responseText.substring(2269 - 19, 2333 - 19)
        var body10 = xhrurl.responseText.substring(2269 - 20, 2333 - 20)
        var body11 = xhrurl.responseText.substring(2269 - 21, 2333 - 21)
        var body12 = xhrurl.responseText.substring(2269 - 22, 2333 - 22)
        var body13 = xhrurl.responseText.substring(2269 - 23, 2333 - 23)
        var body14 = xhrurl.responseText.substring(2269 - 24, 2333 - 24)
        var body15 = xhrurl.responseText.substring(2269 - 25, 2333 - 25)
        var body16 = xhrurl.responseText.substring(2269 - 26, 2333 - 26)

        if (
          heada == 'src="' ||
          headb == 'src="' ||
          headc == 'src="' ||
          headd == 'src="' ||
          heade == 'src="' ||
          headf == 'src="' ||
          headg == 'src="' ||
          headh == 'src="' ||
          headi == 'src="' ||
          headj == 'src="' ||
          headk == 'src="' ||
          headl == 'src="' ||
          headm == 'src="' ||
          headn == 'src="' ||
          heado == 'src="' ||
          headp == 'src="' ||
          headq == 'src="' ||
          headr == 'src="' ||
          heads == 'src="' ||
          headt == 'src="' ||
          head1 == 'src="' ||
          head2 == 'src="' ||
          head3 == 'src="' ||
          head4 == 'src="' ||
          head5 == 'src="' ||
          head6 == 'src="' ||
          head7 == 'src="' ||
          head8 == 'src="' ||
          head9 == 'src="' ||
          head10 == 'src="' ||
          head11 == 'src="' ||
          head11 == 'src="' ||
          head12 == 'src="' ||
          head13 == 'src="' ||
          head14 == 'src="' ||
          head15 == 'src="' ||
          head16 == 'src="') {
          console.log(headg, bodyg)
          if (heada == 'src="') {
            xhrurl.onload = () => {
              const headers = new HttpHeaders()
                .set("Content-Type", "application/json");
              selfurl.api.put("table/z_channel_stream_detail",
                {
                  "id": dataarray.id,
                  "url_anime": bodya
                },
                { headers })
                .subscribe(val => {

                }, err => {
                  const headers = new HttpHeaders()
                    .set("Content-Type", "application/json");
                  selfurl.api.put("table/z_channel_stream_detail",
                    {
                      "id": dataarray.id,
                      "url_anime": bodya
                    },
                    { headers })
                    .subscribe(val => {

                    }, err => {
                      console.log('error')
                    })
                })
            }
          }
          else if (headb == 'src="') {
            xhrurl.onload = () => {
              const headers = new HttpHeaders()
                .set("Content-Type", "application/json");
              selfurl.api.put("table/z_channel_stream_detail",
                {
                  "id": dataarray.id,
                  "url_anime": bodyb
                },
                { headers })
                .subscribe(val => {

                }, err => {
                  const headers = new HttpHeaders()
                    .set("Content-Type", "application/json");
                  selfurl.api.put("table/z_channel_stream_detail",
                    {
                      "id": dataarray.id,
                      "url_anime": bodyb
                    },
                    { headers })
                    .subscribe(val => {

                    }, err => {
                      console.log('error')
                    })
                })
            }
          }
          else if (headc == 'src="') {
            xhrurl.onload = () => {
              const headers = new HttpHeaders()
                .set("Content-Type", "application/json");
              selfurl.api.put("table/z_channel_stream_detail",
                {
                  "id": dataarray.id,
                  "url_anime": bodyc
                },
                { headers })
                .subscribe(val => {

                }, err => {
                  const headers = new HttpHeaders()
                    .set("Content-Type", "application/json");
                  selfurl.api.put("table/z_channel_stream_detail",
                    {
                      "id": dataarray.id,
                      "url_anime": bodyc
                    },
                    { headers })
                    .subscribe(val => {

                    }, err => {
                      console.log('error')
                    })
                })
            }
          }
          else if (headd == 'src="') {
            xhrurl.onload = () => {
              const headers = new HttpHeaders()
                .set("Content-Type", "application/json");
              selfurl.api.put("table/z_channel_stream_detail",
                {
                  "id": dataarray.id,
                  "url_anime": bodyd
                },
                { headers })
                .subscribe(val => {

                }, err => {
                  const headers = new HttpHeaders()
                    .set("Content-Type", "application/json");
                  selfurl.api.put("table/z_channel_stream_detail",
                    {
                      "id": dataarray.id,
                      "url_anime": bodyd
                    },
                    { headers })
                    .subscribe(val => {

                    }, err => {
                      console.log('error')
                    })
                })
            }
          }
          else if (heade == 'src="') {
            xhrurl.onload = () => {
              const headers = new HttpHeaders()
                .set("Content-Type", "application/json");
              selfurl.api.put("table/z_channel_stream_detail",
                {
                  "id": dataarray.id,
                  "url_anime": bodye
                },
                { headers })
                .subscribe(val => {

                }, err => {
                  const headers = new HttpHeaders()
                    .set("Content-Type", "application/json");
                  selfurl.api.put("table/z_channel_stream_detail",
                    {
                      "id": dataarray.id,
                      "url_anime": bodye
                    },
                    { headers })
                    .subscribe(val => {

                    }, err => {
                      console.log('error')
                    })
                })
            }
          }
          else if (headf == 'src="') {
            xhrurl.onload = () => {
              const headers = new HttpHeaders()
                .set("Content-Type", "application/json");
              selfurl.api.put("table/z_channel_stream_detail",
                {
                  "id": dataarray.id,
                  "url_anime": bodyf
                },
                { headers })
                .subscribe(val => {

                }, err => {
                  const headers = new HttpHeaders()
                    .set("Content-Type", "application/json");
                  selfurl.api.put("table/z_channel_stream_detail",
                    {
                      "id": dataarray.id,
                      "url_anime": bodyf
                    },
                    { headers })
                    .subscribe(val => {

                    }, err => {
                      console.log('error')
                    })
                })
            }
          }
          else if (headg == 'src="') {
            xhrurl.onload = () => {
              const headers = new HttpHeaders()
                .set("Content-Type", "application/json");
              selfurl.api.put("table/z_channel_stream_detail",
                {
                  "id": dataarray.id,
                  "url_anime": bodyg
                },
                { headers })
                .subscribe(val => {

                }, err => {
                  const headers = new HttpHeaders()
                    .set("Content-Type", "application/json");
                  selfurl.api.put("table/z_channel_stream_detail",
                    {
                      "id": dataarray.id,
                      "url_anime": bodyg
                    },
                    { headers })
                    .subscribe(val => {

                    }, err => {
                      console.log('error')
                    })
                })
            }
          }
          else if (headh == 'src="') {
            xhrurl.onload = () => {
              const headers = new HttpHeaders()
                .set("Content-Type", "application/json");
              selfurl.api.put("table/z_channel_stream_detail",
                {
                  "id": dataarray.id,
                  "url_anime": bodyh
                },
                { headers })
                .subscribe(val => {

                }, err => {
                  const headers = new HttpHeaders()
                    .set("Content-Type", "application/json");
                  selfurl.api.put("table/z_channel_stream_detail",
                    {
                      "id": dataarray.id,
                      "url_anime": bodyh
                    },
                    { headers })
                    .subscribe(val => {

                    }, err => {
                      console.log('error')
                    })
                })
            }
          }
          else if (headi == 'src="') {
            xhrurl.onload = () => {
              const headers = new HttpHeaders()
                .set("Content-Type", "application/json");
              selfurl.api.put("table/z_channel_stream_detail",
                {
                  "id": dataarray.id,
                  "url_anime": bodyi
                },
                { headers })
                .subscribe(val => {

                }, err => {
                  const headers = new HttpHeaders()
                    .set("Content-Type", "application/json");
                  selfurl.api.put("table/z_channel_stream_detail",
                    {
                      "id": dataarray.id,
                      "url_anime": bodyi
                    },
                    { headers })
                    .subscribe(val => {

                    }, err => {
                      console.log('error')
                    })
                })
            }
          }
          else if (headj == 'src="') {
            xhrurl.onload = () => {
              const headers = new HttpHeaders()
                .set("Content-Type", "application/json");
              selfurl.api.put("table/z_channel_stream_detail",
                {
                  "id": dataarray.id,
                  "url_anime": bodyj
                },
                { headers })
                .subscribe(val => {

                }, err => {
                  const headers = new HttpHeaders()
                    .set("Content-Type", "application/json");
                  selfurl.api.put("table/z_channel_stream_detail",
                    {
                      "id": dataarray.id,
                      "url_anime": bodyj
                    },
                    { headers })
                    .subscribe(val => {

                    }, err => {
                      console.log('error')
                    })
                })
            }
          }
          else if (headk == 'src="') {
            xhrurl.onload = () => {
              const headers = new HttpHeaders()
                .set("Content-Type", "application/json");
              selfurl.api.put("table/z_channel_stream_detail",
                {
                  "id": dataarray.id,
                  "url_anime": bodyk
                },
                { headers })
                .subscribe(val => {

                }, err => {
                  const headers = new HttpHeaders()
                    .set("Content-Type", "application/json");
                  selfurl.api.put("table/z_channel_stream_detail",
                    {
                      "id": dataarray.id,
                      "url_anime": bodyk
                    },
                    { headers })
                    .subscribe(val => {

                    }, err => {
                      console.log('error')
                    })
                })
            }
          }
          else if (headl == 'src="') {
            xhrurl.onload = () => {
              const headers = new HttpHeaders()
                .set("Content-Type", "application/json");
              selfurl.api.put("table/z_channel_stream_detail",
                {
                  "id": dataarray.id,
                  "url_anime": bodyl
                },
                { headers })
                .subscribe(val => {

                }, err => {
                  const headers = new HttpHeaders()
                    .set("Content-Type", "application/json");
                  selfurl.api.put("table/z_channel_stream_detail",
                    {
                      "id": dataarray.id,
                      "url_anime": bodyl
                    },
                    { headers })
                    .subscribe(val => {

                    }, err => {
                      console.log('error')
                    })
                })
            }
          }
          else if (headm == 'src="') {
            xhrurl.onload = () => {
              const headers = new HttpHeaders()
                .set("Content-Type", "application/json");
              selfurl.api.put("table/z_channel_stream_detail",
                {
                  "id": dataarray.id,
                  "url_anime": bodym
                },
                { headers })
                .subscribe(val => {

                }, err => {
                  const headers = new HttpHeaders()
                    .set("Content-Type", "application/json");
                  selfurl.api.put("table/z_channel_stream_detail",
                    {
                      "id": dataarray.id,
                      "url_anime": bodym
                    },
                    { headers })
                    .subscribe(val => {

                    }, err => {
                      console.log('error')
                    })
                })
            }
          }
          else if (headm == 'src="') {
            xhrurl.onload = () => {
              const headers = new HttpHeaders()
                .set("Content-Type", "application/json");
              selfurl.api.put("table/z_channel_stream_detail",
                {
                  "id": dataarray.id,
                  "url_anime": bodyn
                },
                { headers })
                .subscribe(val => {

                }, err => {
                  const headers = new HttpHeaders()
                    .set("Content-Type", "application/json");
                  selfurl.api.put("table/z_channel_stream_detail",
                    {
                      "id": dataarray.id,
                      "url_anime": bodyn
                    },
                    { headers })
                    .subscribe(val => {

                    }, err => {
                      console.log('error')
                    })
                })
            }
          }
          else if (heado == 'src="') {
            xhrurl.onload = () => {
              const headers = new HttpHeaders()
                .set("Content-Type", "application/json");
              selfurl.api.put("table/z_channel_stream_detail",
                {
                  "id": dataarray.id,
                  "url_anime": bodyo
                },
                { headers })
                .subscribe(val => {

                }, err => {
                  const headers = new HttpHeaders()
                    .set("Content-Type", "application/json");
                  selfurl.api.put("table/z_channel_stream_detail",
                    {
                      "id": dataarray.id,
                      "url_anime": bodyo
                    },
                    { headers })
                    .subscribe(val => {

                    }, err => {
                      console.log('error')
                    })
                })
            }
          }
          else if (headp == 'src="') {
            xhrurl.onload = () => {
              const headers = new HttpHeaders()
                .set("Content-Type", "application/json");
              selfurl.api.put("table/z_channel_stream_detail",
                {
                  "id": dataarray.id,
                  "url_anime": bodyp
                },
                { headers })
                .subscribe(val => {

                }, err => {
                  const headers = new HttpHeaders()
                    .set("Content-Type", "application/json");
                  selfurl.api.put("table/z_channel_stream_detail",
                    {
                      "id": dataarray.id,
                      "url_anime": bodyp
                    },
                    { headers })
                    .subscribe(val => {

                    }, err => {
                      console.log('error')
                    })
                })
            }
          }
          else if (headq == 'src="') {
            xhrurl.onload = () => {
              const headers = new HttpHeaders()
                .set("Content-Type", "application/json");
              selfurl.api.put("table/z_channel_stream_detail",
                {
                  "id": dataarray.id,
                  "url_anime": bodyq
                },
                { headers })
                .subscribe(val => {

                }, err => {
                  const headers = new HttpHeaders()
                    .set("Content-Type", "application/json");
                  selfurl.api.put("table/z_channel_stream_detail",
                    {
                      "id": dataarray.id,
                      "url_anime": bodyq
                    },
                    { headers })
                    .subscribe(val => {

                    }, err => {
                      console.log('error')
                    })
                })
            }
          }
          else if (headr == 'src="') {
            xhrurl.onload = () => {
              const headers = new HttpHeaders()
                .set("Content-Type", "application/json");
              selfurl.api.put("table/z_channel_stream_detail",
                {
                  "id": dataarray.id,
                  "url_anime": bodyr
                },
                { headers })
                .subscribe(val => {

                }, err => {
                  const headers = new HttpHeaders()
                    .set("Content-Type", "application/json");
                  selfurl.api.put("table/z_channel_stream_detail",
                    {
                      "id": dataarray.id,
                      "url_anime": bodyr
                    },
                    { headers })
                    .subscribe(val => {

                    }, err => {
                      console.log('error')
                    })
                })
            }
          }
          else if (heads == 'src="') {
            xhrurl.onload = () => {
              const headers = new HttpHeaders()
                .set("Content-Type", "application/json");
              selfurl.api.put("table/z_channel_stream_detail",
                {
                  "id": dataarray.id,
                  "url_anime": bodys
                },
                { headers })
                .subscribe(val => {

                }, err => {
                  const headers = new HttpHeaders()
                    .set("Content-Type", "application/json");
                  selfurl.api.put("table/z_channel_stream_detail",
                    {
                      "id": dataarray.id,
                      "url_anime": bodys
                    },
                    { headers })
                    .subscribe(val => {

                    }, err => {
                      console.log('error')
                    })
                })
            }
          }
          else if (headt == 'src="') {
            xhrurl.onload = () => {
              const headers = new HttpHeaders()
                .set("Content-Type", "application/json");
              selfurl.api.put("table/z_channel_stream_detail",
                {
                  "id": dataarray.id,
                  "url_anime": bodyt
                },
                { headers })
                .subscribe(val => {

                }, err => {
                  const headers = new HttpHeaders()
                    .set("Content-Type", "application/json");
                  selfurl.api.put("table/z_channel_stream_detail",
                    {
                      "id": dataarray.id,
                      "url_anime": bodyt
                    },
                    { headers })
                    .subscribe(val => {

                    }, err => {
                      console.log('error')
                    })
                })
            }
          }
          else if (head1 == 'src="') {
            xhrurl.onload = () => {
              const headers = new HttpHeaders()
                .set("Content-Type", "application/json");
              selfurl.api.put("table/z_channel_stream_detail",
                {
                  "id": dataarray.id,
                  "url_anime": body1
                },
                { headers })
                .subscribe(val => {

                }, err => {
                  const headers = new HttpHeaders()
                    .set("Content-Type", "application/json");
                  selfurl.api.put("table/z_channel_stream_detail",
                    {
                      "id": dataarray.id,
                      "url_anime": body1
                    },
                    { headers })
                    .subscribe(val => {

                    }, err => {
                      console.log('error')
                    })
                })
            }
          }
          else if (head2 == 'src="') {
            xhrurl.onload = () => {
              const headers = new HttpHeaders()
                .set("Content-Type", "application/json");
              selfurl.api.put("table/z_channel_stream_detail",
                {
                  "id": dataarray.id,
                  "url_anime": body2
                },
                { headers })
                .subscribe(val => {

                }, err => {
                  const headers = new HttpHeaders()
                    .set("Content-Type", "application/json");
                  selfurl.api.put("table/z_channel_stream_detail",
                    {
                      "id": dataarray.id,
                      "url_anime": body2
                    },
                    { headers })
                    .subscribe(val => {

                    }, err => {
                      console.log('error')
                    })
                })
            }
          }
          else if (head3 == 'src="') {
            xhrurl.onload = () => {
              const headers = new HttpHeaders()
                .set("Content-Type", "application/json");
              selfurl.api.put("table/z_channel_stream_detail",
                {
                  "id": dataarray.id,
                  "url_anime": body3
                },
                { headers })
                .subscribe(val => {

                }, err => {
                  const headers = new HttpHeaders()
                    .set("Content-Type", "application/json");
                  selfurl.api.put("table/z_channel_stream_detail",
                    {
                      "id": dataarray.id,
                      "url_anime": body3
                    },
                    { headers })
                    .subscribe(val => {

                    }, err => {
                      console.log('error')
                    })
                })
            }
          }
          else if (head4 == 'src="') {
            xhrurl.onload = () => {
              const headers = new HttpHeaders()
                .set("Content-Type", "application/json");
              selfurl.api.put("table/z_channel_stream_detail",
                {
                  "id": dataarray.id,
                  "url_anime": body4
                },
                { headers })
                .subscribe(val => {

                }, err => {
                  const headers = new HttpHeaders()
                    .set("Content-Type", "application/json");
                  selfurl.api.put("table/z_channel_stream_detail",
                    {
                      "id": dataarray.id,
                      "url_anime": body4
                    },
                    { headers })
                    .subscribe(val => {

                    }, err => {
                      console.log('error')
                    })
                })
            }
          }
          else if (head5 == 'src="') {
            xhrurl.onload = () => {
              const headers = new HttpHeaders()
                .set("Content-Type", "application/json");
              selfurl.api.put("table/z_channel_stream_detail",
                {
                  "id": dataarray.id,
                  "url_anime": body5
                },
                { headers })
                .subscribe(val => {

                }, err => {
                  const headers = new HttpHeaders()
                    .set("Content-Type", "application/json");
                  selfurl.api.put("table/z_channel_stream_detail",
                    {
                      "id": dataarray.id,
                      "url_anime": body5
                    },
                    { headers })
                    .subscribe(val => {

                    }, err => {
                      console.log('error')
                    })
                })
            }
          }
          else if (head6 == 'src="') {
            xhrurl.onload = () => {
              const headers = new HttpHeaders()
                .set("Content-Type", "application/json");
              selfurl.api.put("table/z_channel_stream_detail",
                {
                  "id": dataarray.id,
                  "url_anime": body6
                },
                { headers })
                .subscribe(val => {

                }, err => {
                  const headers = new HttpHeaders()
                    .set("Content-Type", "application/json");
                  selfurl.api.put("table/z_channel_stream_detail",
                    {
                      "id": dataarray.id,
                      "url_anime": body6
                    },
                    { headers })
                    .subscribe(val => {

                    }, err => {
                      console.log('error')
                    })
                })
            }
          }
          else if (head7 == 'src="') {
            xhrurl.onload = () => {
              const headers = new HttpHeaders()
                .set("Content-Type", "application/json");
              selfurl.api.put("table/z_channel_stream_detail",
                {
                  "id": dataarray.id,
                  "url_anime": body7
                },
                { headers })
                .subscribe(val => {

                }, err => {
                  const headers = new HttpHeaders()
                    .set("Content-Type", "application/json");
                  selfurl.api.put("table/z_channel_stream_detail",
                    {
                      "id": dataarray.id,
                      "url_anime": body7
                    },
                    { headers })
                    .subscribe(val => {

                    }, err => {
                      console.log('error')
                    })
                })
            }
          }
          else if (head8 == 'src="') {
            xhrurl.onload = () => {
              const headers = new HttpHeaders()
                .set("Content-Type", "application/json");
              selfurl.api.put("table/z_channel_stream_detail",
                {
                  "id": dataarray.id,
                  "url_anime": body8
                },
                { headers })
                .subscribe(val => {

                }, err => {
                  const headers = new HttpHeaders()
                    .set("Content-Type", "application/json");
                  selfurl.api.put("table/z_channel_stream_detail",
                    {
                      "id": dataarray.id,
                      "url_anime": body8
                    },
                    { headers })
                    .subscribe(val => {

                    }, err => {
                      console.log('error')
                    })
                })
            }
          }
          else if (head9 == 'src="') {
            xhrurl.onload = () => {
              const headers = new HttpHeaders()
                .set("Content-Type", "application/json");
              selfurl.api.put("table/z_channel_stream_detail",
                {
                  "id": dataarray.id,
                  "url_anime": body9
                },
                { headers })
                .subscribe(val => {

                }, err => {
                  const headers = new HttpHeaders()
                    .set("Content-Type", "application/json");
                  selfurl.api.put("table/z_channel_stream_detail",
                    {
                      "id": dataarray.id,
                      "url_anime": body9
                    },
                    { headers })
                    .subscribe(val => {

                    }, err => {
                      console.log('error')
                    })
                })
            }
          }
          else if (head10 == 'src="') {
            xhrurl.onload = () => {
              const headers = new HttpHeaders()
                .set("Content-Type", "application/json");
              selfurl.api.put("table/z_channel_stream_detail",
                {
                  "id": dataarray.id,
                  "url_anime": body10
                },
                { headers })
                .subscribe(val => {

                }, err => {
                  const headers = new HttpHeaders()
                    .set("Content-Type", "application/json");
                  selfurl.api.put("table/z_channel_stream_detail",
                    {
                      "id": dataarray.id,
                      "url_anime": body10
                    },
                    { headers })
                    .subscribe(val => {

                    }, err => {
                      console.log('error')
                    })
                })
            }
          }
          else if (head11 == 'src="') {
            xhrurl.onload = () => {
              const headers = new HttpHeaders()
                .set("Content-Type", "application/json");
              selfurl.api.put("table/z_channel_stream_detail",
                {
                  "id": dataarray.id,
                  "url_anime": body11
                },
                { headers })
                .subscribe(val => {

                }, err => {
                  const headers = new HttpHeaders()
                    .set("Content-Type", "application/json");
                  selfurl.api.put("table/z_channel_stream_detail",
                    {
                      "id": dataarray.id,
                      "url_anime": body11
                    },
                    { headers })
                    .subscribe(val => {

                    }, err => {
                      console.log('error')
                    })
                })
            }
          }
          else if (head12 == 'src="') {
            xhrurl.onload = () => {
              const headers = new HttpHeaders()
                .set("Content-Type", "application/json");
              selfurl.api.put("table/z_channel_stream_detail",
                {
                  "id": dataarray.id,
                  "url_anime": body12
                },
                { headers })
                .subscribe(val => {

                }, err => {
                  const headers = new HttpHeaders()
                    .set("Content-Type", "application/json");
                  selfurl.api.put("table/z_channel_stream_detail",
                    {
                      "id": dataarray.id,
                      "url_anime": body12
                    },
                    { headers })
                    .subscribe(val => {

                    }, err => {
                      console.log('error')
                    })
                })
            }
          }
          else if (head13 == 'src="') {
            xhrurl.onload = () => {
              const headers = new HttpHeaders()
                .set("Content-Type", "application/json");
              selfurl.api.put("table/z_channel_stream_detail",
                {
                  "id": dataarray.id,
                  "url_anime": body13
                },
                { headers })
                .subscribe(val => {

                }, err => {
                  const headers = new HttpHeaders()
                    .set("Content-Type", "application/json");
                  selfurl.api.put("table/z_channel_stream_detail",
                    {
                      "id": dataarray.id,
                      "url_anime": body13
                    },
                    { headers })
                    .subscribe(val => {

                    }, err => {
                      console.log('error')
                    })
                })
            }
          }
          else if (head14 == 'src="') {
            xhrurl.onload = () => {
              const headers = new HttpHeaders()
                .set("Content-Type", "application/json");
              selfurl.api.put("table/z_channel_stream_detail",
                {
                  "id": dataarray.id,
                  "url_anime": body14
                },
                { headers })
                .subscribe(val => {

                }, err => {
                  const headers = new HttpHeaders()
                    .set("Content-Type", "application/json");
                  selfurl.api.put("table/z_channel_stream_detail",
                    {
                      "id": dataarray.id,
                      "url_anime": body14
                    },
                    { headers })
                    .subscribe(val => {

                    }, err => {
                      console.log('error')
                    })
                })
            }
          }
          else if (head15 == 'src="') {
            xhrurl.onload = () => {
              const headers = new HttpHeaders()
                .set("Content-Type", "application/json");
              selfurl.api.put("table/z_channel_stream_detail",
                {
                  "id": dataarray.id,
                  "url_anime": body15
                },
                { headers })
                .subscribe(val => {

                }, err => {
                  const headers = new HttpHeaders()
                    .set("Content-Type", "application/json");
                  selfurl.api.put("table/z_channel_stream_detail",
                    {
                      "id": dataarray.id,
                      "url_anime": body15
                    },
                    { headers })
                    .subscribe(val => {

                    }, err => {
                      console.log('error')
                    })
                })
            }
          }
          else if (head16 == 'src="') {
            xhrurl.onload = () => {
              const headers = new HttpHeaders()
                .set("Content-Type", "application/json");
              selfurl.api.put("table/z_channel_stream_detail",
                {
                  "id": dataarray.id,
                  "url_anime": body16
                },
                { headers })
                .subscribe(val => {

                }, err => {
                  const headers = new HttpHeaders()
                    .set("Content-Type", "application/json");
                  selfurl.api.put("table/z_channel_stream_detail",
                    {
                      "id": dataarray.id,
                      "url_anime": body16
                    },
                    { headers })
                    .subscribe(val => {

                    }, err => {
                      console.log('error')
                    })
                })
            }
          }
        }
        else {
          console.log(bodya)
        }
      }
    }
    xhrurl.open('GET', url, true);
    xhrurl.send(null);
  }
  doGetUrl() {
    this.api.get("table/z_premium", { params: { limit: 10000, filter: "status='OPEN' AND link='http://liveonlinetv247.info'" } })
      .subscribe(val => {
        let data = val['data'];
        for (let i = 0; i < data.length; i++) {
          let dataarray = data[i]
          /*let loader = this.loadingCtrl.create({
            // cssClass: 'transparent',
            content: 'Get ' + data[i].name + " Channel"
          });*/
          /*loader.present().then(() => {*/
          this.doGetLinkUrl(dataarray)
          if (i == (data.length - 1)) {
            this.doGetChannel();
          }
          /*loader.dismiss();
        });*/
        }
      });
  }
  doGetLinkUrl(dataarray) {
    var selfurl = this
    var url = dataarray.url
    var xhrurl = new XMLHttpRequest();
    xhrurl.onreadystatechange = function () {
      if (xhrurl.readyState == XMLHttpRequest.DONE) {
        var heada = xhrurl.responseText.substring(5600, 5601)
        var headb = xhrurl.responseText.substring(5600 - 1, 5601 - 1)
        var headc = xhrurl.responseText.substring(5600 - 2, 5601 - 2)
        var headd = xhrurl.responseText.substring(5600 - 3, 5601 - 3)
        var heade = xhrurl.responseText.substring(5600 - 4, 5601 - 4)
        var headf = xhrurl.responseText.substring(5600 - 5, 5601 - 5)
        var headg = xhrurl.responseText.substring(5600 + 1, 5601 + 1)
        var headh = xhrurl.responseText.substring(5600 + 2, 5601 + 2)
        var headi = xhrurl.responseText.substring(5600 + 3, 5601 + 3)
        var headj = xhrurl.responseText.substring(5600 + 4, 5601 + 4)
        var headk = xhrurl.responseText.substring(5600 + 5, 5601 + 5)
        var head2a = xhrurl.responseText.substring(4470, 4471)
        var head2b = xhrurl.responseText.substring(4470 - 1, 4471 - 1)
        var head2c = xhrurl.responseText.substring(4470 - 2, 4471 - 2)
        var head2d = xhrurl.responseText.substring(4470 - 3, 4471 - 3)
        var head2e = xhrurl.responseText.substring(4470 - 4, 4471 - 4)
        var head2f = xhrurl.responseText.substring(4470 - 5, 4471 + 5)
        var head2g = xhrurl.responseText.substring(4470 + 1, 4471 + 1)
        var head2h = xhrurl.responseText.substring(4470 + 2, 4471 + 2)
        var head2i = xhrurl.responseText.substring(4470 + 3, 4471 + 3)
        var head2j = xhrurl.responseText.substring(4470 + 4, 4471 + 4)
        var bodya = xhrurl.responseText.substring(5601, 15039)
        var bodyb = xhrurl.responseText.substring(5601 - 1, 15039 - 1)
        var bodyc = xhrurl.responseText.substring(5601 - 2, 15039 - 2)
        var bodyd = xhrurl.responseText.substring(5601 - 3, 15039 - 3)
        var bodye = xhrurl.responseText.substring(5601 - 4, 15039 - 4)
        var bodyf = xhrurl.responseText.substring(5601 - 5, 15039 - 5)
        var bodyg = xhrurl.responseText.substring(5601 + 1, 15039 + 1)
        var bodyh = xhrurl.responseText.substring(5601 + 2, 15039 + 2)
        var bodyi = xhrurl.responseText.substring(5601 + 3, 15039 + 3)
        var bodyj = xhrurl.responseText.substring(5601 + 4, 15039 + 4)
        var body2a = xhrurl.responseText.substring(4471, 13910)
        var body2b = xhrurl.responseText.substring(4471 - 1, 13910 - 1)
        var body2c = xhrurl.responseText.substring(4471 - 2, 13910 - 2)
        var body2d = xhrurl.responseText.substring(4471 - 3, 13910 - 3)
        var body2e = xhrurl.responseText.substring(4471 - 4, 13910 - 4)
        var body2f = xhrurl.responseText.substring(4471 - 5, 13910 - 5)
        var body2g = xhrurl.responseText.substring(4471 + 1, 13910 + 1)
        var body2h = xhrurl.responseText.substring(4471 + 2, 13910 + 2)
        var body2i = xhrurl.responseText.substring(4471 + 3, 13910 + 3)
        var body2j = xhrurl.responseText.substring(4471 + 4, 13910 + 4)
        var digita = xhrurl.responseText.substring(5601, 5609)
        var digitb = xhrurl.responseText.substring(5601 - 1, 5609 - 1)
        var digitc = xhrurl.responseText.substring(5601 - 2, 5609 - 2)
        var digitd = xhrurl.responseText.substring(5601 - 3, 5609 - 3)
        var digite = xhrurl.responseText.substring(5601 - 4, 5609 - 4)
        var digitf = xhrurl.responseText.substring(5601 - 5, 5609 - 5)
        var digitg = xhrurl.responseText.substring(5601 + 1, 5609 + 1)
        var digith = xhrurl.responseText.substring(5601 + 2, 5609 + 2)
        var digiti = xhrurl.responseText.substring(5601 + 3, 5609 + 3)
        var digitj = xhrurl.responseText.substring(5601 + 4, 5609 + 4)
        var digit2a = xhrurl.responseText.substring(4471, 4479)
        var digit2b = xhrurl.responseText.substring(4471 - 1, 4479 - 1)
        var digit2c = xhrurl.responseText.substring(4471 - 2, 4479 - 2)
        var digit2d = xhrurl.responseText.substring(4471 - 3, 4479 - 3)
        var digit2e = xhrurl.responseText.substring(4471 - 4, 4479 - 4)
        var digit2f = xhrurl.responseText.substring(4471 - 5, 4479 - 5)
        var digit2g = xhrurl.responseText.substring(4471 + 1, 4479 + 1)
        var digit2h = xhrurl.responseText.substring(4471 + 2, 4479 + 2)
        var digit2i = xhrurl.responseText.substring(4471 + 3, 4479 + 3)
        var digit2j = xhrurl.responseText.substring(4471 + 4, 4479 + 4)
        if (
          heada == '[' ||
          headb == '[' ||
          headc == '[' ||
          headd == '[' ||
          heade == '[' ||
          headf == '[' ||
          headg == '[' ||
          headh == '[' ||
          headi == '[' ||
          headj == '[' ||
          head2a == '[' ||
          head2b == '[' ||
          head2c == '[' ||
          head2d == '[' ||
          head2e == '[' ||
          head2f == '[' ||
          head2g == '[' ||
          head2h == '[' ||
          head2i == '[' ||
          head2j == '['
        ) {
          if (heada == '[') {
            let pengurangan = parseInt(digita) - 60
            let x = "";
            let y = bodya.split(',');
            y.forEach(function z(value) { x += String.fromCharCode(parseInt(value) - pengurangan); });
            let url = x.substring(dataarray.subsurl_1, dataarray.subsurl_2)
            console.log('1', url)
            xhrurl.onload = () => {
              let datetime = moment().format('YYYY-MM-DD HH:mm');
              const headers = new HttpHeaders()
                .set("Content-Type", "application/json");
              selfurl.api.put("table/z_channel",
                {
                  "id": dataarray.id_channel,
                  "url": url,
                  "datetime": datetime
                },
                { headers })
                .subscribe(val => {
                  console.log('sukses')
                  if (dataarray.id_channel_2 != '') {
                    let datetime = moment().format('YYYY-MM-DD HH:mm');
                    const headers = new HttpHeaders()
                      .set("Content-Type", "application/json");
                    selfurl.api.put("table/z_channel",
                      {
                        "id": dataarray.id_channel_2,
                        "url": url,
                        "datetime": datetime
                      },
                      { headers })
                      .subscribe(val => {
                        console.log('sukses 2')
                      });
                  }
                  if (dataarray.id_channel_3 != '') {
                    let datetime = moment().format('YYYY-MM-DD HH:mm');
                    const headers = new HttpHeaders()
                      .set("Content-Type", "application/json");
                    selfurl.api.put("table/z_channel",
                      {
                        "id": dataarray.id_channel_3,
                        "url": url,
                        "datetime": datetime
                      },
                      { headers })
                      .subscribe(val => {
                        console.log('sukses 3')
                      });
                  }
                  if (dataarray.id_channel_live != '') {
                    let datetime = moment().format('YYYY-MM-DD HH:mm');
                    const headers = new HttpHeaders()
                      .set("Content-Type", "application/json");
                    selfurl.api.put("table/z_channel_live",
                      {
                        "id": dataarray.id_channel_live,
                        "url": url
                      },
                      { headers })
                      .subscribe(val => {
                        console.log('sukses 4')
                      });
                  }
                  if (dataarray.id_channel_live_2 != '') {
                    let datetime = moment().format('YYYY-MM-DD HH:mm');
                    const headers = new HttpHeaders()
                      .set("Content-Type", "application/json");
                    selfurl.api.put("table/z_channel_live",
                      {
                        "id": dataarray.id_channel_live_2,
                        "url": url
                      },
                      { headers })
                      .subscribe(val => {
                        console.log('sukses 5')
                      });
                  }
                  if (dataarray.id_channel_live_3 != '') {
                    let datetime = moment().format('YYYY-MM-DD HH:mm');
                    const headers = new HttpHeaders()
                      .set("Content-Type", "application/json");
                    selfurl.api.put("table/z_channel_live",
                      {
                        "id": dataarray.id_channel_live_3,
                        "url": url
                      },
                      { headers })
                      .subscribe(val => {
                        console.log('sukses 6')
                      });
                  }
                }, (err) => {
                  selfurl.doGetLinkUrl(dataarray);
                });
            }
          }
          else if (headb == '[') {
            let pengurangan = parseInt(digitb) - 60
            let x = "";
            let y = bodyb.split(',');
            y.forEach(function z(value) { x += String.fromCharCode(parseInt(value) - pengurangan); });
            let url = x.substring(dataarray.subsurl_1, dataarray.subsurl_2)
            console.log('2', url)
            xhrurl.onload = () => {
              let datetime = moment().format('YYYY-MM-DD HH:mm');
              const headers = new HttpHeaders()
                .set("Content-Type", "application/json");
              selfurl.api.put("table/z_channel",
                {
                  "id": dataarray.id_channel,
                  "url": url,
                  "datetime": datetime
                },
                { headers })
                .subscribe(val => {
                  console.log('sukses')
                  if (dataarray.id_channel_2 != '') {
                    let datetime = moment().format('YYYY-MM-DD HH:mm');
                    const headers = new HttpHeaders()
                      .set("Content-Type", "application/json");
                    selfurl.api.put("table/z_channel",
                      {
                        "id": dataarray.id_channel_2,
                        "url": url,
                        "datetime": datetime
                      },
                      { headers })
                      .subscribe(val => {
                        console.log('sukses 2')
                      });
                  }
                  if (dataarray.id_channel_3 != '') {
                    let datetime = moment().format('YYYY-MM-DD HH:mm');
                    const headers = new HttpHeaders()
                      .set("Content-Type", "application/json");
                    selfurl.api.put("table/z_channel",
                      {
                        "id": dataarray.id_channel_3,
                        "url": url,
                        "datetime": datetime
                      },
                      { headers })
                      .subscribe(val => {
                        console.log('sukses 3')
                      });
                  }
                  if (dataarray.id_channel_live != '') {
                    let datetime = moment().format('YYYY-MM-DD HH:mm');
                    const headers = new HttpHeaders()
                      .set("Content-Type", "application/json");
                    selfurl.api.put("table/z_channel_live",
                      {
                        "id": dataarray.id_channel_live,
                        "url": url
                      },
                      { headers })
                      .subscribe(val => {
                        console.log('sukses 4')
                      });
                  }
                  if (dataarray.id_channel_live_2 != '') {
                    let datetime = moment().format('YYYY-MM-DD HH:mm');
                    const headers = new HttpHeaders()
                      .set("Content-Type", "application/json");
                    selfurl.api.put("table/z_channel_live",
                      {
                        "id": dataarray.id_channel_live_2,
                        "url": url
                      },
                      { headers })
                      .subscribe(val => {
                        console.log('sukses 5')
                      });
                  }
                  if (dataarray.id_channel_live_3 != '') {
                    let datetime = moment().format('YYYY-MM-DD HH:mm');
                    const headers = new HttpHeaders()
                      .set("Content-Type", "application/json");
                    selfurl.api.put("table/z_channel_live",
                      {
                        "id": dataarray.id_channel_live_3,
                        "url": url
                      },
                      { headers })
                      .subscribe(val => {
                        console.log('sukses 6')
                      });
                  }
                }, (err) => {
                  selfurl.doGetLinkUrl(dataarray);
                });
            }
          }
          else if (headc == '[') {
            let pengurangan = parseInt(digitc) - 60
            let x = "";
            let y = bodyc.split(',');
            y.forEach(function z(value) { x += String.fromCharCode(parseInt(value) - pengurangan); });
            let url = x.substring(dataarray.subsurl_1, dataarray.subsurl_2)
            console.log('3', url)
            xhrurl.onload = () => {
              let datetime = moment().format('YYYY-MM-DD HH:mm');
              const headers = new HttpHeaders()
                .set("Content-Type", "application/json");
              selfurl.api.put("table/z_channel",
                {
                  "id": dataarray.id_channel,
                  "url": url,
                  "datetime": datetime
                },
                { headers })
                .subscribe(val => {
                  console.log('sukses')
                  if (dataarray.id_channel_2 != '') {
                    let datetime = moment().format('YYYY-MM-DD HH:mm');
                    const headers = new HttpHeaders()
                      .set("Content-Type", "application/json");
                    selfurl.api.put("table/z_channel",
                      {
                        "id": dataarray.id_channel_2,
                        "url": url,
                        "datetime": datetime
                      },
                      { headers })
                      .subscribe(val => {
                        console.log('sukses 2')
                      });
                  }
                  if (dataarray.id_channel_3 != '') {
                    let datetime = moment().format('YYYY-MM-DD HH:mm');
                    const headers = new HttpHeaders()
                      .set("Content-Type", "application/json");
                    selfurl.api.put("table/z_channel",
                      {
                        "id": dataarray.id_channel_3,
                        "url": url,
                        "datetime": datetime
                      },
                      { headers })
                      .subscribe(val => {
                        console.log('sukses 3')
                      });
                  }
                  if (dataarray.id_channel_live != '') {
                    let datetime = moment().format('YYYY-MM-DD HH:mm');
                    const headers = new HttpHeaders()
                      .set("Content-Type", "application/json");
                    selfurl.api.put("table/z_channel_live",
                      {
                        "id": dataarray.id_channel_live,
                        "url": url
                      },
                      { headers })
                      .subscribe(val => {
                        console.log('sukses 4')
                      });
                  }
                  if (dataarray.id_channel_live_2 != '') {
                    let datetime = moment().format('YYYY-MM-DD HH:mm');
                    const headers = new HttpHeaders()
                      .set("Content-Type", "application/json");
                    selfurl.api.put("table/z_channel_live",
                      {
                        "id": dataarray.id_channel_live_2,
                        "url": url
                      },
                      { headers })
                      .subscribe(val => {
                        console.log('sukses 5')
                      });
                  }
                  if (dataarray.id_channel_live_3 != '') {
                    let datetime = moment().format('YYYY-MM-DD HH:mm');
                    const headers = new HttpHeaders()
                      .set("Content-Type", "application/json");
                    selfurl.api.put("table/z_channel_live",
                      {
                        "id": dataarray.id_channel_live_3,
                        "url": url
                      },
                      { headers })
                      .subscribe(val => {
                        console.log('sukses 6')
                      });
                  }
                }, (err) => {
                  selfurl.doGetLinkUrl(dataarray);
                });
            }
          }
          else if (headd == '[') {
            let pengurangan = parseInt(digitd) - 60
            let x = "";
            let y = bodyd.split(',');
            y.forEach(function z(value) { x += String.fromCharCode(parseInt(value) - pengurangan); });
            let url = x.substring(dataarray.subsurl_1, dataarray.subsurl_2)
            console.log('4', url)
            xhrurl.onload = () => {
              let datetime = moment().format('YYYY-MM-DD HH:mm');
              const headers = new HttpHeaders()
                .set("Content-Type", "application/json");
              selfurl.api.put("table/z_channel",
                {
                  "id": dataarray.id_channel,
                  "url": url,
                  "datetime": datetime
                },
                { headers })
                .subscribe(val => {
                  console.log('sukses')
                  if (dataarray.id_channel_2 != '') {
                    let datetime = moment().format('YYYY-MM-DD HH:mm');
                    const headers = new HttpHeaders()
                      .set("Content-Type", "application/json");
                    selfurl.api.put("table/z_channel",
                      {
                        "id": dataarray.id_channel_2,
                        "url": url,
                        "datetime": datetime
                      },
                      { headers })
                      .subscribe(val => {
                        console.log('sukses 2')
                      });
                  }
                  if (dataarray.id_channel_3 != '') {
                    let datetime = moment().format('YYYY-MM-DD HH:mm');
                    const headers = new HttpHeaders()
                      .set("Content-Type", "application/json");
                    selfurl.api.put("table/z_channel",
                      {
                        "id": dataarray.id_channel_3,
                        "url": url,
                        "datetime": datetime
                      },
                      { headers })
                      .subscribe(val => {
                        console.log('sukses 3')
                      });
                  }
                  if (dataarray.id_channel_live != '') {
                    let datetime = moment().format('YYYY-MM-DD HH:mm');
                    const headers = new HttpHeaders()
                      .set("Content-Type", "application/json");
                    selfurl.api.put("table/z_channel_live",
                      {
                        "id": dataarray.id_channel_live,
                        "url": url
                      },
                      { headers })
                      .subscribe(val => {
                        console.log('sukses 4')
                      });
                  }
                  if (dataarray.id_channel_live_2 != '') {
                    let datetime = moment().format('YYYY-MM-DD HH:mm');
                    const headers = new HttpHeaders()
                      .set("Content-Type", "application/json");
                    selfurl.api.put("table/z_channel_live",
                      {
                        "id": dataarray.id_channel_live_2,
                        "url": url
                      },
                      { headers })
                      .subscribe(val => {
                        console.log('sukses 5')
                      });
                  }
                  if (dataarray.id_channel_live_3 != '') {
                    let datetime = moment().format('YYYY-MM-DD HH:mm');
                    const headers = new HttpHeaders()
                      .set("Content-Type", "application/json");
                    selfurl.api.put("table/z_channel_live",
                      {
                        "id": dataarray.id_channel_live_3,
                        "url": url
                      },
                      { headers })
                      .subscribe(val => {
                        console.log('sukses 6')
                      });
                  }
                }, (err) => {
                  selfurl.doGetLinkUrl(dataarray);
                });
            }
          }
          else if (heade == '[') {
            let pengurangan = parseInt(digite) - 60
            let x = "";
            let y = bodye.split(',');
            y.forEach(function z(value) { x += String.fromCharCode(parseInt(value) - pengurangan); });
            let url = x.substring(dataarray.subsurl_1, dataarray.subsurl_2)
            console.log('5', url)
            xhrurl.onload = () => {
              let datetime = moment().format('YYYY-MM-DD HH:mm');
              const headers = new HttpHeaders()
                .set("Content-Type", "application/json");
              selfurl.api.put("table/z_channel",
                {
                  "id": dataarray.id_channel,
                  "url": url,
                  "datetime": datetime
                },
                { headers })
                .subscribe(val => {
                  console.log('sukses')
                  if (dataarray.id_channel_2 != '') {
                    let datetime = moment().format('YYYY-MM-DD HH:mm');
                    const headers = new HttpHeaders()
                      .set("Content-Type", "application/json");
                    selfurl.api.put("table/z_channel",
                      {
                        "id": dataarray.id_channel_2,
                        "url": url,
                        "datetime": datetime
                      },
                      { headers })
                      .subscribe(val => {
                        console.log('sukses 2')
                      });
                  }
                  if (dataarray.id_channel_3 != '') {
                    let datetime = moment().format('YYYY-MM-DD HH:mm');
                    const headers = new HttpHeaders()
                      .set("Content-Type", "application/json");
                    selfurl.api.put("table/z_channel",
                      {
                        "id": dataarray.id_channel_3,
                        "url": url,
                        "datetime": datetime
                      },
                      { headers })
                      .subscribe(val => {
                        console.log('sukses 3')
                      });
                  }
                  if (dataarray.id_channel_live != '') {
                    let datetime = moment().format('YYYY-MM-DD HH:mm');
                    const headers = new HttpHeaders()
                      .set("Content-Type", "application/json");
                    selfurl.api.put("table/z_channel_live",
                      {
                        "id": dataarray.id_channel_live,
                        "url": url
                      },
                      { headers })
                      .subscribe(val => {
                        console.log('sukses 4')
                      });
                  }
                  if (dataarray.id_channel_live_2 != '') {
                    let datetime = moment().format('YYYY-MM-DD HH:mm');
                    const headers = new HttpHeaders()
                      .set("Content-Type", "application/json");
                    selfurl.api.put("table/z_channel_live",
                      {
                        "id": dataarray.id_channel_live_2,
                        "url": url
                      },
                      { headers })
                      .subscribe(val => {
                        console.log('sukses 5')
                      });
                  }
                  if (dataarray.id_channel_live_3 != '') {
                    let datetime = moment().format('YYYY-MM-DD HH:mm');
                    const headers = new HttpHeaders()
                      .set("Content-Type", "application/json");
                    selfurl.api.put("table/z_channel_live",
                      {
                        "id": dataarray.id_channel_live_3,
                        "url": url
                      },
                      { headers })
                      .subscribe(val => {
                        console.log('sukses 6')
                      });
                  }
                }, (err) => {
                  selfurl.doGetLinkUrl(dataarray);
                });
            }
          }
          else if (headf == '[') {
            let pengurangan = parseInt(digitf) - 60
            let x = "";
            let y = bodyf.split(',');
            y.forEach(function z(value) { x += String.fromCharCode(parseInt(value) - pengurangan); });
            let url = x.substring(dataarray.subsurl_1, dataarray.subsurl_2)
            console.log('6', url)
            xhrurl.onload = () => {
              let datetime = moment().format('YYYY-MM-DD HH:mm');
              const headers = new HttpHeaders()
                .set("Content-Type", "application/json");
              selfurl.api.put("table/z_channel",
                {
                  "id": dataarray.id_channel,
                  "url": url,
                  "datetime": datetime
                },
                { headers })
                .subscribe(val => {
                  console.log('sukses')
                  if (dataarray.id_channel_2 != '') {
                    let datetime = moment().format('YYYY-MM-DD HH:mm');
                    const headers = new HttpHeaders()
                      .set("Content-Type", "application/json");
                    selfurl.api.put("table/z_channel",
                      {
                        "id": dataarray.id_channel_2,
                        "url": url,
                        "datetime": datetime
                      },
                      { headers })
                      .subscribe(val => {
                        console.log('sukses 2')
                      });
                  }
                  if (dataarray.id_channel_3 != '') {
                    let datetime = moment().format('YYYY-MM-DD HH:mm');
                    const headers = new HttpHeaders()
                      .set("Content-Type", "application/json");
                    selfurl.api.put("table/z_channel",
                      {
                        "id": dataarray.id_channel_3,
                        "url": url,
                        "datetime": datetime
                      },
                      { headers })
                      .subscribe(val => {
                        console.log('sukses 3')
                      });
                  }
                  if (dataarray.id_channel_live != '') {
                    let datetime = moment().format('YYYY-MM-DD HH:mm');
                    const headers = new HttpHeaders()
                      .set("Content-Type", "application/json");
                    selfurl.api.put("table/z_channel_live",
                      {
                        "id": dataarray.id_channel_live,
                        "url": url
                      },
                      { headers })
                      .subscribe(val => {
                        console.log('sukses 4')
                      });
                  }
                  if (dataarray.id_channel_live_2 != '') {
                    let datetime = moment().format('YYYY-MM-DD HH:mm');
                    const headers = new HttpHeaders()
                      .set("Content-Type", "application/json");
                    selfurl.api.put("table/z_channel_live",
                      {
                        "id": dataarray.id_channel_live_2,
                        "url": url
                      },
                      { headers })
                      .subscribe(val => {
                        console.log('sukses 5')
                      });
                  }
                  if (dataarray.id_channel_live_3 != '') {
                    let datetime = moment().format('YYYY-MM-DD HH:mm');
                    const headers = new HttpHeaders()
                      .set("Content-Type", "application/json");
                    selfurl.api.put("table/z_channel_live",
                      {
                        "id": dataarray.id_channel_live_3,
                        "url": url
                      },
                      { headers })
                      .subscribe(val => {
                        console.log('sukses 6')
                      });
                  }
                }, (err) => {
                  selfurl.doGetLinkUrl(dataarray);
                });
            }
          }
          else if (headg == '[') {
            let pengurangan = parseInt(digitg) - 60
            let x = "";
            let y = bodyg.split(',');
            y.forEach(function z(value) { x += String.fromCharCode(parseInt(value) - pengurangan); });
            let url = x.substring(dataarray.subsurl_1, dataarray.subsurl_2)
            console.log('7', url)
            xhrurl.onload = () => {
              let datetime = moment().format('YYYY-MM-DD HH:mm');
              const headers = new HttpHeaders()
                .set("Content-Type", "application/json");
              selfurl.api.put("table/z_channel",
                {
                  "id": dataarray.id_channel,
                  "url": url,
                  "datetime": datetime
                },
                { headers })
                .subscribe(val => {
                  console.log('sukses')
                  if (dataarray.id_channel_2 != '') {
                    let datetime = moment().format('YYYY-MM-DD HH:mm');
                    const headers = new HttpHeaders()
                      .set("Content-Type", "application/json");
                    selfurl.api.put("table/z_channel",
                      {
                        "id": dataarray.id_channel_2,
                        "url": url,
                        "datetime": datetime
                      },
                      { headers })
                      .subscribe(val => {
                        console.log('sukses 2')
                      });
                  }
                  if (dataarray.id_channel_3 != '') {
                    let datetime = moment().format('YYYY-MM-DD HH:mm');
                    const headers = new HttpHeaders()
                      .set("Content-Type", "application/json");
                    selfurl.api.put("table/z_channel",
                      {
                        "id": dataarray.id_channel_3,
                        "url": url,
                        "datetime": datetime
                      },
                      { headers })
                      .subscribe(val => {
                        console.log('sukses 3')
                      });
                  }
                  if (dataarray.id_channel_live != '') {
                    let datetime = moment().format('YYYY-MM-DD HH:mm');
                    const headers = new HttpHeaders()
                      .set("Content-Type", "application/json");
                    selfurl.api.put("table/z_channel_live",
                      {
                        "id": dataarray.id_channel_live,
                        "url": url
                      },
                      { headers })
                      .subscribe(val => {
                        console.log('sukses 4')
                      });
                  }
                  if (dataarray.id_channel_live_2 != '') {
                    let datetime = moment().format('YYYY-MM-DD HH:mm');
                    const headers = new HttpHeaders()
                      .set("Content-Type", "application/json");
                    selfurl.api.put("table/z_channel_live",
                      {
                        "id": dataarray.id_channel_live_2,
                        "url": url
                      },
                      { headers })
                      .subscribe(val => {
                        console.log('sukses 5')
                      });
                  }
                  if (dataarray.id_channel_live_3 != '') {
                    let datetime = moment().format('YYYY-MM-DD HH:mm');
                    const headers = new HttpHeaders()
                      .set("Content-Type", "application/json");
                    selfurl.api.put("table/z_channel_live",
                      {
                        "id": dataarray.id_channel_live_3,
                        "url": url
                      },
                      { headers })
                      .subscribe(val => {
                        console.log('sukses 6')
                      });
                  }
                }, (err) => {
                  selfurl.doGetLinkUrl(dataarray);
                });
            }
          }
          else if (headh == '[') {
            let pengurangan = parseInt(digith) - 60
            let x = "";
            let y = bodyh.split(',');
            y.forEach(function z(value) { x += String.fromCharCode(parseInt(value) - pengurangan); });
            let url = x.substring(dataarray.subsurl_1, dataarray.subsurl_2)
            console.log('8', url)
            xhrurl.onload = () => {
              let datetime = moment().format('YYYY-MM-DD HH:mm');
              const headers = new HttpHeaders()
                .set("Content-Type", "application/json");
              selfurl.api.put("table/z_channel",
                {
                  "id": dataarray.id_channel,
                  "url": url,
                  "datetime": datetime
                },
                { headers })
                .subscribe(val => {
                  console.log('sukses')
                  if (dataarray.id_channel_2 != '') {
                    let datetime = moment().format('YYYY-MM-DD HH:mm');
                    const headers = new HttpHeaders()
                      .set("Content-Type", "application/json");
                    selfurl.api.put("table/z_channel",
                      {
                        "id": dataarray.id_channel_2,
                        "url": url,
                        "datetime": datetime
                      },
                      { headers })
                      .subscribe(val => {
                        console.log('sukses 2')
                      });
                  }
                  if (dataarray.id_channel_3 != '') {
                    let datetime = moment().format('YYYY-MM-DD HH:mm');
                    const headers = new HttpHeaders()
                      .set("Content-Type", "application/json");
                    selfurl.api.put("table/z_channel",
                      {
                        "id": dataarray.id_channel_3,
                        "url": url,
                        "datetime": datetime
                      },
                      { headers })
                      .subscribe(val => {
                        console.log('sukses 3')
                      });
                  }
                  if (dataarray.id_channel_live != '') {
                    let datetime = moment().format('YYYY-MM-DD HH:mm');
                    const headers = new HttpHeaders()
                      .set("Content-Type", "application/json");
                    selfurl.api.put("table/z_channel_live",
                      {
                        "id": dataarray.id_channel_live,
                        "url": url
                      },
                      { headers })
                      .subscribe(val => {
                        console.log('sukses 4')
                      });
                  }
                  if (dataarray.id_channel_live_2 != '') {
                    let datetime = moment().format('YYYY-MM-DD HH:mm');
                    const headers = new HttpHeaders()
                      .set("Content-Type", "application/json");
                    selfurl.api.put("table/z_channel_live",
                      {
                        "id": dataarray.id_channel_live_2,
                        "url": url
                      },
                      { headers })
                      .subscribe(val => {
                        console.log('sukses 5')
                      });
                  }
                  if (dataarray.id_channel_live_3 != '') {
                    let datetime = moment().format('YYYY-MM-DD HH:mm');
                    const headers = new HttpHeaders()
                      .set("Content-Type", "application/json");
                    selfurl.api.put("table/z_channel_live",
                      {
                        "id": dataarray.id_channel_live_3,
                        "url": url
                      },
                      { headers })
                      .subscribe(val => {
                        console.log('sukses 6')
                      });
                  }
                }, (err) => {
                  selfurl.doGetLinkUrl(dataarray);
                });
            }
          }
          else if (headi == '[') {
            let pengurangan = parseInt(digiti) - 60
            let x = "";
            let y = bodyi.split(',');
            y.forEach(function z(value) { x += String.fromCharCode(parseInt(value) - pengurangan); });
            let url = x.substring(dataarray.subsurl_1, dataarray.subsurl_2)
            console.log('9', url)
            xhrurl.onload = () => {
              let datetime = moment().format('YYYY-MM-DD HH:mm');
              const headers = new HttpHeaders()
                .set("Content-Type", "application/json");
              selfurl.api.put("table/z_channel",
                {
                  "id": dataarray.id_channel,
                  "url": url,
                  "datetime": datetime
                },
                { headers })
                .subscribe(val => {
                  console.log('sukses')
                  if (dataarray.id_channel_2 != '') {
                    let datetime = moment().format('YYYY-MM-DD HH:mm');
                    const headers = new HttpHeaders()
                      .set("Content-Type", "application/json");
                    selfurl.api.put("table/z_channel",
                      {
                        "id": dataarray.id_channel_2,
                        "url": url,
                        "datetime": datetime
                      },
                      { headers })
                      .subscribe(val => {
                        console.log('sukses 2')
                      });
                  }
                  if (dataarray.id_channel_3 != '') {
                    let datetime = moment().format('YYYY-MM-DD HH:mm');
                    const headers = new HttpHeaders()
                      .set("Content-Type", "application/json");
                    selfurl.api.put("table/z_channel",
                      {
                        "id": dataarray.id_channel_3,
                        "url": url,
                        "datetime": datetime
                      },
                      { headers })
                      .subscribe(val => {
                        console.log('sukses 3')
                      });
                  }
                  if (dataarray.id_channel_live != '') {
                    let datetime = moment().format('YYYY-MM-DD HH:mm');
                    const headers = new HttpHeaders()
                      .set("Content-Type", "application/json");
                    selfurl.api.put("table/z_channel_live",
                      {
                        "id": dataarray.id_channel_live,
                        "url": url
                      },
                      { headers })
                      .subscribe(val => {
                        console.log('sukses 4')
                      });
                  }
                  if (dataarray.id_channel_live_2 != '') {
                    let datetime = moment().format('YYYY-MM-DD HH:mm');
                    const headers = new HttpHeaders()
                      .set("Content-Type", "application/json");
                    selfurl.api.put("table/z_channel_live",
                      {
                        "id": dataarray.id_channel_live_2,
                        "url": url
                      },
                      { headers })
                      .subscribe(val => {
                        console.log('sukses 5')
                      });
                  }
                  if (dataarray.id_channel_live_3 != '') {
                    let datetime = moment().format('YYYY-MM-DD HH:mm');
                    const headers = new HttpHeaders()
                      .set("Content-Type", "application/json");
                    selfurl.api.put("table/z_channel_live",
                      {
                        "id": dataarray.id_channel_live_3,
                        "url": url
                      },
                      { headers })
                      .subscribe(val => {
                        console.log('sukses 6')
                      });
                  }
                }, (err) => {
                  selfurl.doGetLinkUrl(dataarray);
                });
            }
          }
          else if (headj == '[') {
            let pengurangan = parseInt(digitj) - 60
            let x = "";
            let y = bodyj.split(',');
            y.forEach(function z(value) { x += String.fromCharCode(parseInt(value) - pengurangan); });
            let url = x.substring(dataarray.subsurl_1, dataarray.subsurl_2)
            console.log('10', url)
            xhrurl.onload = () => {
              let datetime = moment().format('YYYY-MM-DD HH:mm');
              const headers = new HttpHeaders()
                .set("Content-Type", "application/json");
              selfurl.api.put("table/z_channel",
                {
                  "id": dataarray.id_channel,
                  "url": url,
                  "datetime": datetime
                },
                { headers })
                .subscribe(val => {
                  console.log('sukses')
                  if (dataarray.id_channel_2 != '') {
                    let datetime = moment().format('YYYY-MM-DD HH:mm');
                    const headers = new HttpHeaders()
                      .set("Content-Type", "application/json");
                    selfurl.api.put("table/z_channel",
                      {
                        "id": dataarray.id_channel_2,
                        "url": url,
                        "datetime": datetime
                      },
                      { headers })
                      .subscribe(val => {
                        console.log('sukses 2')
                      });
                  }
                  if (dataarray.id_channel_3 != '') {
                    let datetime = moment().format('YYYY-MM-DD HH:mm');
                    const headers = new HttpHeaders()
                      .set("Content-Type", "application/json");
                    selfurl.api.put("table/z_channel",
                      {
                        "id": dataarray.id_channel_3,
                        "url": url,
                        "datetime": datetime
                      },
                      { headers })
                      .subscribe(val => {
                        console.log('sukses 3')
                      });
                  }
                  if (dataarray.id_channel_live != '') {
                    let datetime = moment().format('YYYY-MM-DD HH:mm');
                    const headers = new HttpHeaders()
                      .set("Content-Type", "application/json");
                    selfurl.api.put("table/z_channel_live",
                      {
                        "id": dataarray.id_channel_live,
                        "url": url
                      },
                      { headers })
                      .subscribe(val => {
                        console.log('sukses 4')
                      });
                  }
                  if (dataarray.id_channel_live_2 != '') {
                    let datetime = moment().format('YYYY-MM-DD HH:mm');
                    const headers = new HttpHeaders()
                      .set("Content-Type", "application/json");
                    selfurl.api.put("table/z_channel_live",
                      {
                        "id": dataarray.id_channel_live_2,
                        "url": url
                      },
                      { headers })
                      .subscribe(val => {
                        console.log('sukses 5')
                      });
                  }
                  if (dataarray.id_channel_live_3 != '') {
                    let datetime = moment().format('YYYY-MM-DD HH:mm');
                    const headers = new HttpHeaders()
                      .set("Content-Type", "application/json");
                    selfurl.api.put("table/z_channel_live",
                      {
                        "id": dataarray.id_channel_live_3,
                        "url": url
                      },
                      { headers })
                      .subscribe(val => {
                        console.log('sukses 6')
                      });
                  }
                }, (err) => {
                  selfurl.doGetLinkUrl(dataarray);
                });
            }
          }
          else if (head2a == '[') {
            let pengurangan = parseInt(digit2a) - 60
            let x = "";
            let y = body2a.split(',');
            y.forEach(function z(value) { x += String.fromCharCode(parseInt(value) - pengurangan); });
            let url = x.substring(dataarray.subsurl_1, dataarray.subsurl_2)
            console.log('11', url)
            xhrurl.onload = () => {
              let datetime = moment().format('YYYY-MM-DD HH:mm');
              const headers = new HttpHeaders()
                .set("Content-Type", "application/json");
              selfurl.api.put("table/z_channel",
                {
                  "id": dataarray.id_channel,
                  "url": url,
                  "datetime": datetime
                },
                { headers })
                .subscribe(val => {
                  console.log('sukses')
                  if (dataarray.id_channel_2 != '') {
                    let datetime = moment().format('YYYY-MM-DD HH:mm');
                    const headers = new HttpHeaders()
                      .set("Content-Type", "application/json");
                    selfurl.api.put("table/z_channel",
                      {
                        "id": dataarray.id_channel_2,
                        "url": url,
                        "datetime": datetime
                      },
                      { headers })
                      .subscribe(val => {
                        console.log('sukses 2')
                      });
                  }
                  if (dataarray.id_channel_3 != '') {
                    let datetime = moment().format('YYYY-MM-DD HH:mm');
                    const headers = new HttpHeaders()
                      .set("Content-Type", "application/json");
                    selfurl.api.put("table/z_channel",
                      {
                        "id": dataarray.id_channel_3,
                        "url": url,
                        "datetime": datetime
                      },
                      { headers })
                      .subscribe(val => {
                        console.log('sukses 3')
                      });
                  }
                  if (dataarray.id_channel_live != '') {
                    let datetime = moment().format('YYYY-MM-DD HH:mm');
                    const headers = new HttpHeaders()
                      .set("Content-Type", "application/json");
                    selfurl.api.put("table/z_channel_live",
                      {
                        "id": dataarray.id_channel_live,
                        "url": url
                      },
                      { headers })
                      .subscribe(val => {
                        console.log('sukses 4')
                      });
                  }
                  if (dataarray.id_channel_live_2 != '') {
                    let datetime = moment().format('YYYY-MM-DD HH:mm');
                    const headers = new HttpHeaders()
                      .set("Content-Type", "application/json");
                    selfurl.api.put("table/z_channel_live",
                      {
                        "id": dataarray.id_channel_live_2,
                        "url": url
                      },
                      { headers })
                      .subscribe(val => {
                        console.log('sukses 5')
                      });
                  }
                  if (dataarray.id_channel_live_3 != '') {
                    let datetime = moment().format('YYYY-MM-DD HH:mm');
                    const headers = new HttpHeaders()
                      .set("Content-Type", "application/json");
                    selfurl.api.put("table/z_channel_live",
                      {
                        "id": dataarray.id_channel_live_3,
                        "url": url
                      },
                      { headers })
                      .subscribe(val => {
                        console.log('sukses 6')
                      });
                  }
                }, (err) => {
                  selfurl.doGetLinkUrl(dataarray);
                });
            }
          }
          else if (head2b == '[') {
            let pengurangan = parseInt(digit2b) - 60
            let x = "";
            let y = body2b.split(',');
            y.forEach(function z(value) { x += String.fromCharCode(parseInt(value) - pengurangan); });
            let url = x.substring(dataarray.subsurl_1, dataarray.subsurl_2)
            console.log('12', url)
            xhrurl.onload = () => {
              let datetime = moment().format('YYYY-MM-DD HH:mm');
              const headers = new HttpHeaders()
                .set("Content-Type", "application/json");
              selfurl.api.put("table/z_channel",
                {
                  "id": dataarray.id_channel,
                  "url": url,
                  "datetime": datetime
                },
                { headers })
                .subscribe(val => {
                  console.log('sukses')
                  if (dataarray.id_channel_2 != '') {
                    let datetime = moment().format('YYYY-MM-DD HH:mm');
                    const headers = new HttpHeaders()
                      .set("Content-Type", "application/json");
                    selfurl.api.put("table/z_channel",
                      {
                        "id": dataarray.id_channel_2,
                        "url": url,
                        "datetime": datetime
                      },
                      { headers })
                      .subscribe(val => {
                        console.log('sukses 2')
                      });
                  }
                  if (dataarray.id_channel_3 != '') {
                    let datetime = moment().format('YYYY-MM-DD HH:mm');
                    const headers = new HttpHeaders()
                      .set("Content-Type", "application/json");
                    selfurl.api.put("table/z_channel",
                      {
                        "id": dataarray.id_channel_3,
                        "url": url,
                        "datetime": datetime
                      },
                      { headers })
                      .subscribe(val => {
                        console.log('sukses 3')
                      });
                  }
                  if (dataarray.id_channel_live != '') {
                    let datetime = moment().format('YYYY-MM-DD HH:mm');
                    const headers = new HttpHeaders()
                      .set("Content-Type", "application/json");
                    selfurl.api.put("table/z_channel_live",
                      {
                        "id": dataarray.id_channel_live,
                        "url": url
                      },
                      { headers })
                      .subscribe(val => {
                        console.log('sukses 4')
                      });
                  }
                  if (dataarray.id_channel_live_2 != '') {
                    let datetime = moment().format('YYYY-MM-DD HH:mm');
                    const headers = new HttpHeaders()
                      .set("Content-Type", "application/json");
                    selfurl.api.put("table/z_channel_live",
                      {
                        "id": dataarray.id_channel_live_2,
                        "url": url
                      },
                      { headers })
                      .subscribe(val => {
                        console.log('sukses 5')
                      });
                  }
                  if (dataarray.id_channel_live_3 != '') {
                    let datetime = moment().format('YYYY-MM-DD HH:mm');
                    const headers = new HttpHeaders()
                      .set("Content-Type", "application/json");
                    selfurl.api.put("table/z_channel_live",
                      {
                        "id": dataarray.id_channel_live_3,
                        "url": url
                      },
                      { headers })
                      .subscribe(val => {
                        console.log('sukses 6')
                      });
                  }
                }, (err) => {
                  selfurl.doGetLinkUrl(dataarray);
                });
            }
          }
          else if (head2c == '[') {
            let pengurangan = parseInt(digit2c) - 60
            let x = "";
            let y = body2c.split(',');
            y.forEach(function z(value) { x += String.fromCharCode(parseInt(value) - pengurangan); });
            let url = x.substring(dataarray.subsurl_1, dataarray.subsurl_2)
            console.log('13', url)
            xhrurl.onload = () => {
              let datetime = moment().format('YYYY-MM-DD HH:mm');
              const headers = new HttpHeaders()
                .set("Content-Type", "application/json");
              selfurl.api.put("table/z_channel",
                {
                  "id": dataarray.id_channel,
                  "url": url,
                  "datetime": datetime
                },
                { headers })
                .subscribe(val => {
                  console.log('sukses')
                  if (dataarray.id_channel_2 != '') {
                    let datetime = moment().format('YYYY-MM-DD HH:mm');
                    const headers = new HttpHeaders()
                      .set("Content-Type", "application/json");
                    selfurl.api.put("table/z_channel",
                      {
                        "id": dataarray.id_channel_2,
                        "url": url,
                        "datetime": datetime
                      },
                      { headers })
                      .subscribe(val => {
                        console.log('sukses 2')
                      });
                  }
                  if (dataarray.id_channel_3 != '') {
                    let datetime = moment().format('YYYY-MM-DD HH:mm');
                    const headers = new HttpHeaders()
                      .set("Content-Type", "application/json");
                    selfurl.api.put("table/z_channel",
                      {
                        "id": dataarray.id_channel_3,
                        "url": url,
                        "datetime": datetime
                      },
                      { headers })
                      .subscribe(val => {
                        console.log('sukses 3')
                      });
                  }
                  if (dataarray.id_channel_live != '') {
                    let datetime = moment().format('YYYY-MM-DD HH:mm');
                    const headers = new HttpHeaders()
                      .set("Content-Type", "application/json");
                    selfurl.api.put("table/z_channel_live",
                      {
                        "id": dataarray.id_channel_live,
                        "url": url
                      },
                      { headers })
                      .subscribe(val => {
                        console.log('sukses 4')
                      });
                  }
                  if (dataarray.id_channel_live_2 != '') {
                    let datetime = moment().format('YYYY-MM-DD HH:mm');
                    const headers = new HttpHeaders()
                      .set("Content-Type", "application/json");
                    selfurl.api.put("table/z_channel_live",
                      {
                        "id": dataarray.id_channel_live_2,
                        "url": url
                      },
                      { headers })
                      .subscribe(val => {
                        console.log('sukses 5')
                      });
                  }
                  if (dataarray.id_channel_live_3 != '') {
                    let datetime = moment().format('YYYY-MM-DD HH:mm');
                    const headers = new HttpHeaders()
                      .set("Content-Type", "application/json");
                    selfurl.api.put("table/z_channel_live",
                      {
                        "id": dataarray.id_channel_live_3,
                        "url": url
                      },
                      { headers })
                      .subscribe(val => {
                        console.log('sukses 6')
                      });
                  }
                }, (err) => {
                  selfurl.doGetLinkUrl(dataarray);
                });
            }
          }
          else if (head2d == '[') {
            let pengurangan = parseInt(digit2d) - 60
            let x = "";
            let y = body2d.split(',');
            y.forEach(function z(value) { x += String.fromCharCode(parseInt(value) - pengurangan); });
            let url = x.substring(dataarray.subsurl_1, dataarray.subsurl_2)
            console.log('14', url)
            xhrurl.onload = () => {
              let datetime = moment().format('YYYY-MM-DD HH:mm');
              const headers = new HttpHeaders()
                .set("Content-Type", "application/json");
              selfurl.api.put("table/z_channel",
                {
                  "id": dataarray.id_channel,
                  "url": url,
                  "datetime": datetime
                },
                { headers })
                .subscribe(val => {
                  console.log('sukses')
                  if (dataarray.id_channel_2 != '') {
                    let datetime = moment().format('YYYY-MM-DD HH:mm');
                    const headers = new HttpHeaders()
                      .set("Content-Type", "application/json");
                    selfurl.api.put("table/z_channel",
                      {
                        "id": dataarray.id_channel_2,
                        "url": url,
                        "datetime": datetime
                      },
                      { headers })
                      .subscribe(val => {
                        console.log('sukses 2')
                      });
                  }
                  if (dataarray.id_channel_3 != '') {
                    let datetime = moment().format('YYYY-MM-DD HH:mm');
                    const headers = new HttpHeaders()
                      .set("Content-Type", "application/json");
                    selfurl.api.put("table/z_channel",
                      {
                        "id": dataarray.id_channel_3,
                        "url": url,
                        "datetime": datetime
                      },
                      { headers })
                      .subscribe(val => {
                        console.log('sukses 3')
                      });
                  }
                  if (dataarray.id_channel_live != '') {
                    let datetime = moment().format('YYYY-MM-DD HH:mm');
                    const headers = new HttpHeaders()
                      .set("Content-Type", "application/json");
                    selfurl.api.put("table/z_channel_live",
                      {
                        "id": dataarray.id_channel_live,
                        "url": url
                      },
                      { headers })
                      .subscribe(val => {
                        console.log('sukses 4')
                      });
                  }
                  if (dataarray.id_channel_live_2 != '') {
                    let datetime = moment().format('YYYY-MM-DD HH:mm');
                    const headers = new HttpHeaders()
                      .set("Content-Type", "application/json");
                    selfurl.api.put("table/z_channel_live",
                      {
                        "id": dataarray.id_channel_live_2,
                        "url": url
                      },
                      { headers })
                      .subscribe(val => {
                        console.log('sukses 5')
                      });
                  }
                  if (dataarray.id_channel_live_3 != '') {
                    let datetime = moment().format('YYYY-MM-DD HH:mm');
                    const headers = new HttpHeaders()
                      .set("Content-Type", "application/json");
                    selfurl.api.put("table/z_channel_live",
                      {
                        "id": dataarray.id_channel_live_3,
                        "url": url
                      },
                      { headers })
                      .subscribe(val => {
                        console.log('sukses 6')
                      });
                  }
                }, (err) => {
                  selfurl.doGetLinkUrl(dataarray);
                });
            }
          }
          else if (head2e == '[') {
            let pengurangan = parseInt(digit2e) - 60
            let x = "";
            let y = body2e.split(',');
            y.forEach(function z(value) { x += String.fromCharCode(parseInt(value) - pengurangan); });
            let url = x.substring(dataarray.subsurl_1, dataarray.subsurl_2)
            console.log('15', url)
            xhrurl.onload = () => {
              let datetime = moment().format('YYYY-MM-DD HH:mm');
              const headers = new HttpHeaders()
                .set("Content-Type", "application/json");
              selfurl.api.put("table/z_channel",
                {
                  "id": dataarray.id_channel,
                  "url": url,
                  "datetime": datetime
                },
                { headers })
                .subscribe(val => {
                  console.log('sukses')
                  if (dataarray.id_channel_2 != '') {
                    let datetime = moment().format('YYYY-MM-DD HH:mm');
                    const headers = new HttpHeaders()
                      .set("Content-Type", "application/json");
                    selfurl.api.put("table/z_channel",
                      {
                        "id": dataarray.id_channel_2,
                        "url": url,
                        "datetime": datetime
                      },
                      { headers })
                      .subscribe(val => {
                        console.log('sukses 2')
                      });
                  }
                  if (dataarray.id_channel_3 != '') {
                    let datetime = moment().format('YYYY-MM-DD HH:mm');
                    const headers = new HttpHeaders()
                      .set("Content-Type", "application/json");
                    selfurl.api.put("table/z_channel",
                      {
                        "id": dataarray.id_channel_3,
                        "url": url,
                        "datetime": datetime
                      },
                      { headers })
                      .subscribe(val => {
                        console.log('sukses 3')
                      });
                  }
                  if (dataarray.id_channel_live != '') {
                    let datetime = moment().format('YYYY-MM-DD HH:mm');
                    const headers = new HttpHeaders()
                      .set("Content-Type", "application/json");
                    selfurl.api.put("table/z_channel_live",
                      {
                        "id": dataarray.id_channel_live,
                        "url": url
                      },
                      { headers })
                      .subscribe(val => {
                        console.log('sukses 4')
                      });
                  }
                  if (dataarray.id_channel_live_2 != '') {
                    let datetime = moment().format('YYYY-MM-DD HH:mm');
                    const headers = new HttpHeaders()
                      .set("Content-Type", "application/json");
                    selfurl.api.put("table/z_channel_live",
                      {
                        "id": dataarray.id_channel_live_2,
                        "url": url
                      },
                      { headers })
                      .subscribe(val => {
                        console.log('sukses 5')
                      });
                  }
                  if (dataarray.id_channel_live_3 != '') {
                    let datetime = moment().format('YYYY-MM-DD HH:mm');
                    const headers = new HttpHeaders()
                      .set("Content-Type", "application/json");
                    selfurl.api.put("table/z_channel_live",
                      {
                        "id": dataarray.id_channel_live_3,
                        "url": url
                      },
                      { headers })
                      .subscribe(val => {
                        console.log('sukses 6')
                      });
                  }
                }, (err) => {
                  selfurl.doGetLinkUrl(dataarray);
                });
            }
          }
          else if (head2f == '[') {
            let pengurangan = parseInt(digit2f) - 60
            let x = "";
            let y = body2f.split(',');
            y.forEach(function z(value) { x += String.fromCharCode(parseInt(value) - pengurangan); });
            let url = x.substring(dataarray.subsurl_1, dataarray.subsurl_2)
            console.log('16', url)
            xhrurl.onload = () => {
              let datetime = moment().format('YYYY-MM-DD HH:mm');
              const headers = new HttpHeaders()
                .set("Content-Type", "application/json");
              selfurl.api.put("table/z_channel",
                {
                  "id": dataarray.id_channel,
                  "url": url,
                  "datetime": datetime
                },
                { headers })
                .subscribe(val => {
                  console.log('sukses')
                  if (dataarray.id_channel_2 != '') {
                    let datetime = moment().format('YYYY-MM-DD HH:mm');
                    const headers = new HttpHeaders()
                      .set("Content-Type", "application/json");
                    selfurl.api.put("table/z_channel",
                      {
                        "id": dataarray.id_channel_2,
                        "url": url,
                        "datetime": datetime
                      },
                      { headers })
                      .subscribe(val => {
                        console.log('sukses 2')
                      });
                  }
                  if (dataarray.id_channel_3 != '') {
                    let datetime = moment().format('YYYY-MM-DD HH:mm');
                    const headers = new HttpHeaders()
                      .set("Content-Type", "application/json");
                    selfurl.api.put("table/z_channel",
                      {
                        "id": dataarray.id_channel_3,
                        "url": url,
                        "datetime": datetime
                      },
                      { headers })
                      .subscribe(val => {
                        console.log('sukses 3')
                      });
                  }
                  if (dataarray.id_channel_live != '') {
                    let datetime = moment().format('YYYY-MM-DD HH:mm');
                    const headers = new HttpHeaders()
                      .set("Content-Type", "application/json");
                    selfurl.api.put("table/z_channel_live",
                      {
                        "id": dataarray.id_channel_live,
                        "url": url
                      },
                      { headers })
                      .subscribe(val => {
                        console.log('sukses 4')
                      });
                  }
                  if (dataarray.id_channel_live_2 != '') {
                    let datetime = moment().format('YYYY-MM-DD HH:mm');
                    const headers = new HttpHeaders()
                      .set("Content-Type", "application/json");
                    selfurl.api.put("table/z_channel_live",
                      {
                        "id": dataarray.id_channel_live_2,
                        "url": url
                      },
                      { headers })
                      .subscribe(val => {
                        console.log('sukses 5')
                      });
                  }
                  if (dataarray.id_channel_live_3 != '') {
                    let datetime = moment().format('YYYY-MM-DD HH:mm');
                    const headers = new HttpHeaders()
                      .set("Content-Type", "application/json");
                    selfurl.api.put("table/z_channel_live",
                      {
                        "id": dataarray.id_channel_live_3,
                        "url": url
                      },
                      { headers })
                      .subscribe(val => {
                        console.log('sukses 6')
                      });
                  }
                }, (err) => {
                  selfurl.doGetLinkUrl(dataarray);
                });
            }
          }
          else if (head2g == '[') {
            let pengurangan = parseInt(digit2g) - 60
            let x = "";
            let y = body2g.split(',');
            y.forEach(function z(value) { x += String.fromCharCode(parseInt(value) - pengurangan); });
            let url = x.substring(dataarray.subsurl_1, dataarray.subsurl_2)
            console.log('17', url)
            xhrurl.onload = () => {
              let datetime = moment().format('YYYY-MM-DD HH:mm');
              const headers = new HttpHeaders()
                .set("Content-Type", "application/json");
              selfurl.api.put("table/z_channel",
                {
                  "id": dataarray.id_channel,
                  "url": url,
                  "datetime": datetime
                },
                { headers })
                .subscribe(val => {
                  console.log('sukses')
                  if (dataarray.id_channel_2 != '') {
                    let datetime = moment().format('YYYY-MM-DD HH:mm');
                    const headers = new HttpHeaders()
                      .set("Content-Type", "application/json");
                    selfurl.api.put("table/z_channel",
                      {
                        "id": dataarray.id_channel_2,
                        "url": url,
                        "datetime": datetime
                      },
                      { headers })
                      .subscribe(val => {
                        console.log('sukses 2')
                      });
                  }
                  if (dataarray.id_channel_3 != '') {
                    let datetime = moment().format('YYYY-MM-DD HH:mm');
                    const headers = new HttpHeaders()
                      .set("Content-Type", "application/json");
                    selfurl.api.put("table/z_channel",
                      {
                        "id": dataarray.id_channel_3,
                        "url": url,
                        "datetime": datetime
                      },
                      { headers })
                      .subscribe(val => {
                        console.log('sukses 3')
                      });
                  }
                  if (dataarray.id_channel_live != '') {
                    let datetime = moment().format('YYYY-MM-DD HH:mm');
                    const headers = new HttpHeaders()
                      .set("Content-Type", "application/json");
                    selfurl.api.put("table/z_channel_live",
                      {
                        "id": dataarray.id_channel_live,
                        "url": url
                      },
                      { headers })
                      .subscribe(val => {
                        console.log('sukses 4')
                      });
                  }
                  if (dataarray.id_channel_live_2 != '') {
                    let datetime = moment().format('YYYY-MM-DD HH:mm');
                    const headers = new HttpHeaders()
                      .set("Content-Type", "application/json");
                    selfurl.api.put("table/z_channel_live",
                      {
                        "id": dataarray.id_channel_live_2,
                        "url": url
                      },
                      { headers })
                      .subscribe(val => {
                        console.log('sukses 5')
                      });
                  }
                  if (dataarray.id_channel_live_3 != '') {
                    let datetime = moment().format('YYYY-MM-DD HH:mm');
                    const headers = new HttpHeaders()
                      .set("Content-Type", "application/json");
                    selfurl.api.put("table/z_channel_live",
                      {
                        "id": dataarray.id_channel_live_3,
                        "url": url
                      },
                      { headers })
                      .subscribe(val => {
                        console.log('sukses 6')
                      });
                  }
                }, (err) => {
                  selfurl.doGetLinkUrl(dataarray);
                });
            }
          }
          else if (head2h == '[') {
            let pengurangan = parseInt(digit2h) - 60
            let x = "";
            let y = body2h.split(',');
            y.forEach(function z(value) { x += String.fromCharCode(parseInt(value) - pengurangan); });
            let url = x.substring(dataarray.subsurl_1, dataarray.subsurl_2)
            console.log('18', url)
            xhrurl.onload = () => {
              let datetime = moment().format('YYYY-MM-DD HH:mm');
              const headers = new HttpHeaders()
                .set("Content-Type", "application/json");
              selfurl.api.put("table/z_channel",
                {
                  "id": dataarray.id_channel,
                  "url": url,
                  "datetime": datetime
                },
                { headers })
                .subscribe(val => {
                  console.log('sukses')
                  if (dataarray.id_channel_2 != '') {
                    let datetime = moment().format('YYYY-MM-DD HH:mm');
                    const headers = new HttpHeaders()
                      .set("Content-Type", "application/json");
                    selfurl.api.put("table/z_channel",
                      {
                        "id": dataarray.id_channel_2,
                        "url": url,
                        "datetime": datetime
                      },
                      { headers })
                      .subscribe(val => {
                        console.log('sukses 2')
                      });
                  }
                  if (dataarray.id_channel_3 != '') {
                    let datetime = moment().format('YYYY-MM-DD HH:mm');
                    const headers = new HttpHeaders()
                      .set("Content-Type", "application/json");
                    selfurl.api.put("table/z_channel",
                      {
                        "id": dataarray.id_channel_3,
                        "url": url,
                        "datetime": datetime
                      },
                      { headers })
                      .subscribe(val => {
                        console.log('sukses 3')
                      });
                  }
                  if (dataarray.id_channel_live != '') {
                    let datetime = moment().format('YYYY-MM-DD HH:mm');
                    const headers = new HttpHeaders()
                      .set("Content-Type", "application/json");
                    selfurl.api.put("table/z_channel_live",
                      {
                        "id": dataarray.id_channel_live,
                        "url": url
                      },
                      { headers })
                      .subscribe(val => {
                        console.log('sukses 4')
                      });
                  }
                  if (dataarray.id_channel_live_2 != '') {
                    let datetime = moment().format('YYYY-MM-DD HH:mm');
                    const headers = new HttpHeaders()
                      .set("Content-Type", "application/json");
                    selfurl.api.put("table/z_channel_live",
                      {
                        "id": dataarray.id_channel_live_2,
                        "url": url
                      },
                      { headers })
                      .subscribe(val => {
                        console.log('sukses 5')
                      });
                  }
                  if (dataarray.id_channel_live_3 != '') {
                    let datetime = moment().format('YYYY-MM-DD HH:mm');
                    const headers = new HttpHeaders()
                      .set("Content-Type", "application/json");
                    selfurl.api.put("table/z_channel_live",
                      {
                        "id": dataarray.id_channel_live_3,
                        "url": url
                      },
                      { headers })
                      .subscribe(val => {
                        console.log('sukses 6')
                      });
                  }
                }, (err) => {
                  selfurl.doGetLinkUrl(dataarray);
                });
            }
          }
          else if (head2i == '[') {
            let pengurangan = parseInt(digit2i) - 60
            let x = "";
            let y = body2i.split(',');
            y.forEach(function z(value) { x += String.fromCharCode(parseInt(value) - pengurangan); });
            let url = x.substring(dataarray.subsurl_1, dataarray.subsurl_2)
            console.log('19', url)
            xhrurl.onload = () => {
              let datetime = moment().format('YYYY-MM-DD HH:mm');
              const headers = new HttpHeaders()
                .set("Content-Type", "application/json");
              selfurl.api.put("table/z_channel",
                {
                  "id": dataarray.id_channel,
                  "url": url,
                  "datetime": datetime
                },
                { headers })
                .subscribe(val => {
                  console.log('sukses')
                  if (dataarray.id_channel_2 != '') {
                    let datetime = moment().format('YYYY-MM-DD HH:mm');
                    const headers = new HttpHeaders()
                      .set("Content-Type", "application/json");
                    selfurl.api.put("table/z_channel",
                      {
                        "id": dataarray.id_channel_2,
                        "url": url,
                        "datetime": datetime
                      },
                      { headers })
                      .subscribe(val => {
                        console.log('sukses 2')
                      });
                  }
                  if (dataarray.id_channel_3 != '') {
                    let datetime = moment().format('YYYY-MM-DD HH:mm');
                    const headers = new HttpHeaders()
                      .set("Content-Type", "application/json");
                    selfurl.api.put("table/z_channel",
                      {
                        "id": dataarray.id_channel_3,
                        "url": url,
                        "datetime": datetime
                      },
                      { headers })
                      .subscribe(val => {
                        console.log('sukses 3')
                      });
                  }
                  if (dataarray.id_channel_live != '') {
                    let datetime = moment().format('YYYY-MM-DD HH:mm');
                    const headers = new HttpHeaders()
                      .set("Content-Type", "application/json");
                    selfurl.api.put("table/z_channel_live",
                      {
                        "id": dataarray.id_channel_live,
                        "url": url
                      },
                      { headers })
                      .subscribe(val => {
                        console.log('sukses 4')
                      });
                  }
                  if (dataarray.id_channel_live_2 != '') {
                    let datetime = moment().format('YYYY-MM-DD HH:mm');
                    const headers = new HttpHeaders()
                      .set("Content-Type", "application/json");
                    selfurl.api.put("table/z_channel_live",
                      {
                        "id": dataarray.id_channel_live_2,
                        "url": url
                      },
                      { headers })
                      .subscribe(val => {
                        console.log('sukses 5')
                      });
                  }
                  if (dataarray.id_channel_live_3 != '') {
                    let datetime = moment().format('YYYY-MM-DD HH:mm');
                    const headers = new HttpHeaders()
                      .set("Content-Type", "application/json");
                    selfurl.api.put("table/z_channel_live",
                      {
                        "id": dataarray.id_channel_live_3,
                        "url": url
                      },
                      { headers })
                      .subscribe(val => {
                        console.log('sukses 6')
                      });
                  }
                }, (err) => {
                  selfurl.doGetLinkUrl(dataarray);
                });
            }
          }
          else if (head2j == '[') {
            let pengurangan = parseInt(digit2j) - 60
            let x = "";
            let y = body2j.split(',');
            y.forEach(function z(value) { x += String.fromCharCode(parseInt(value) - pengurangan); });
            let url = x.substring(dataarray.subsurl_1, dataarray.subsurl_2)
            console.log('20', url)
            xhrurl.onload = () => {
              let datetime = moment().format('YYYY-MM-DD HH:mm');
              const headers = new HttpHeaders()
                .set("Content-Type", "application/json");
              selfurl.api.put("table/z_channel",
                {
                  "id": dataarray.id_channel,
                  "url": url,
                  "datetime": datetime
                },
                { headers })
                .subscribe(val => {
                  console.log('sukses')
                  if (dataarray.id_channel_2 != '') {
                    let datetime = moment().format('YYYY-MM-DD HH:mm');
                    const headers = new HttpHeaders()
                      .set("Content-Type", "application/json");
                    selfurl.api.put("table/z_channel",
                      {
                        "id": dataarray.id_channel_2,
                        "url": url,
                        "datetime": datetime
                      },
                      { headers })
                      .subscribe(val => {
                        console.log('sukses 2')
                      });
                  }
                  if (dataarray.id_channel_3 != '') {
                    let datetime = moment().format('YYYY-MM-DD HH:mm');
                    const headers = new HttpHeaders()
                      .set("Content-Type", "application/json");
                    selfurl.api.put("table/z_channel",
                      {
                        "id": dataarray.id_channel_3,
                        "url": url,
                        "datetime": datetime
                      },
                      { headers })
                      .subscribe(val => {
                        console.log('sukses 3')
                      });
                  }
                  if (dataarray.id_channel_live != '') {
                    let datetime = moment().format('YYYY-MM-DD HH:mm');
                    const headers = new HttpHeaders()
                      .set("Content-Type", "application/json");
                    selfurl.api.put("table/z_channel_live",
                      {
                        "id": dataarray.id_channel_live,
                        "url": url
                      },
                      { headers })
                      .subscribe(val => {
                        console.log('sukses 4')
                      });
                  }
                  if (dataarray.id_channel_live_2 != '') {
                    let datetime = moment().format('YYYY-MM-DD HH:mm');
                    const headers = new HttpHeaders()
                      .set("Content-Type", "application/json");
                    selfurl.api.put("table/z_channel_live",
                      {
                        "id": dataarray.id_channel_live_2,
                        "url": url
                      },
                      { headers })
                      .subscribe(val => {
                        console.log('sukses 5')
                      });
                  }
                  if (dataarray.id_channel_live_3 != '') {
                    let datetime = moment().format('YYYY-MM-DD HH:mm');
                    const headers = new HttpHeaders()
                      .set("Content-Type", "application/json");
                    selfurl.api.put("table/z_channel_live",
                      {
                        "id": dataarray.id_channel_live_3,
                        "url": url
                      },
                      { headers })
                      .subscribe(val => {
                        console.log('sukses 6')
                      });
                  }
                }, (err) => {
                  selfurl.doGetLinkUrl(dataarray);
                });
            }
          }
        }
        else {
          selfurl.doGetLinkUrl(dataarray);
        }
      }
    }
    xhrurl.open('GET', url, true);
    xhrurl.send(null);
  }
  doGetLink(dataarray) {
    var self = this
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function () {
      if (xhr.readyState == XMLHttpRequest.DONE) {
        var url = xhr.responseText.substring(dataarray.subsurl_1, dataarray.subsurl_2)
        var body = xhr.responseText.substring(dataarray.subsbody_1, dataarray.subsbody_2)
        console.log(url, dataarray.name)
        if (url != dataarray.ip) {
          self.doGetLink(dataarray);
        }
        else {
          xhr.onload = () => {
            let datetime = moment().format('YYYY-MM-DD HH:mm');
            const headers = new HttpHeaders()
              .set("Content-Type", "application/json");
            self.api.put("table/z_channel",
              {
                "id": dataarray.id_channel,
                "url": body,
                "datetime": datetime
              },
              { headers })
              .subscribe(val => {
                console.log('sukses')
              }, (err) => {
                self.doGet();
                /*let alert = self.alertCtrl.create({
                  title: 'Error ' + body,
                  message: 'Do you want to reload?',
                  buttons: [
                    {
                      text: 'Cancel',
                      role: 'cancel',
                      handler: () => {
                      }
                    },
                    {
                      text: 'Reload',
                      handler: () => {
                        self.doGet();
                      }
                    }
                  ]
                });
                alert.present();*/
              });
          }
        }
      }
    }
    xhr.open('GET', dataarray.url, true);
    xhr.send(null);
  }
  doOpenChannel() {
    const headers = new HttpHeaders()
      .set("Content-Type", "application/json");
    this.api.put("table/z_list_channel",
      {
        "id": '000022',
        "status": 'OPEN',
      },
      { headers })
      .subscribe(val => {
        let alert = this.alertCtrl.create({
          subTitle: 'Sukses',
          buttons: ['OK']
        });
        alert.present();
      });
  }
  doClsdChannel() {
    const headers = new HttpHeaders()
      .set("Content-Type", "application/json");
    this.api.put("table/z_list_channel",
      {
        "id": '000022',
        "status": 'CLSD',
      },
      { headers })
      .subscribe(val => {
        let alert = this.alertCtrl.create({
          subTitle: 'Sukses',
          buttons: ['OK']
        });
        alert.present();
      });
  }
  readTextFile(file, callback) {
    var rawFile = new XMLHttpRequest();
    rawFile.overrideMimeType("application/json");
    rawFile.open("GET", file, true);
    rawFile.onreadystatechange = function () {
      if (rawFile.readyState === 4) {
        callback(rawFile.responseText);
      }
    }
    rawFile.send(null);
  }
  doInsertDataTarif() {
    var self = this
    var xhr = new XMLHttpRequest();
    this.api.get("table/krl_masters", { params: { limit: 1000, filter: "status='OPEN'" } })
      .subscribe(val => {
        let data = val['data']
        this.readTextFile(data[0].url, function (text) {
          var data = JSON.parse(text);
          console.log(data);
          console.log(data.data[0])
          for (let i = 0; i < data.data.length; i++) {
            let datatarif = data.data[i]
            let datai = i
            self.doInsertTarif(datatarif, datai)
          }
        });
      });
  }
  doInsertTarif(datatarif, datai) {
    const headers = new HttpHeaders()
      .set("Content-Type", "application/json");
    this.api.post("table/krl_tarif",
      {
        "sts_from_id": datatarif.sts_from_id,
        "sts_from_name": datatarif.sts_from_name,
        "sts_to_id": datatarif.sts_to_id,
        "sts_to_name": datatarif.sts_to_name,
        "tarif": datatarif.tariff,
      },
      { headers })
      .subscribe(val => {
        console.log(datai)
      }, err => {
        this.doInsertTarif(datatarif, datai)
      });
  }
  doInsertDataTrain() {
    var self = this
    var xhr = new XMLHttpRequest();
    this.api.get("table/krl_masters", { params: { limit: 1000, filter: "status='OPEN'" } })
      .subscribe(val => {
        let data = val['data']
        this.readTextFile(data[1].url, function (text) {
          var data = JSON.parse(text);
          console.log(data);
          console.log(data.data[0])
          for (let i = 0; i < data.data.length; i++) {
            let datatrain = data.data[i]
            let datai = i
            self.doInsertTrain(datatrain, datai)
          }
        });
      });
  }
  doInsertTrain(datatrain, datai) {
    const headers = new HttpHeaders()
      .set("Content-Type", "application/json");
    this.api.post("table/krl_train",
      {
        "ka_id": datatrain.ka_id,
        "ka_line": datatrain.ka_line,
        "route": datatrain.route,
        "sts_from": datatrain.sts_from,
        "sts": datatrain.sts,
        "sts_to": datatrain.sts_to,
        "arr_time": datatrain.arr_time,
        "dep_time": datatrain.dep_time,
        "notstop": datatrain.notstop,
        "status": datatrain.status,
      },
      { headers })
      .subscribe(val => {
        console.log(datai)
      }, err => {
        this.doInsertTrain(datatrain, datai)
      });
  }
  doProcess() {
    this.api.get("table/krl_tarif", { params: { limit: 1000, group: 'sts_from_id', sort: "sts_from_id" + " ASC " } })
      .subscribe(val => {
        let data = val['data']
        console.log(data)
        for (let i = 0; i < data.length; i++) {
          this.api.get("table/krl_tarif", { params: { limit: 1, filter: 'sts_from_id=' + "'" + data[i].sts_from_id + "'" } })
            .subscribe(val => {
              let datasts = val['data']
              let datai = i
              this.doInsertSts(datasts, datai)
            });
        }
      });
  }
  doInsertSts(datasts, datai) {
    this.api.get("table/krl_train", { params: { limit: 1, filter: 'sts=' + "'" + datasts[0].sts_from_name + "'" } })
      .subscribe(val => {
        let datatrain = val['data']
        const headers = new HttpHeaders()
          .set("Content-Type", "application/json");
        this.api.post("table/krl_sts",
          {
            "sts_id": datasts[0].sts_from_id,
            "sts_name": datasts[0].sts_from_name,
            "route": datatrain[0].route,
            "ketinggian": '',
            "latitude": '',
            "longitude": '',
            "parkir": 'Ya',
            "status": 'OPEN',
          },
          { headers })
          .subscribe(val => {
          }, err => {
            this.doInsertSts(datasts, datai)
          });
      });
  }
  doGetTruck() {
    var self = this
    var xhr = new XMLHttpRequest();
    this.api.getLive("tablenav", { params: { limit: 50, table: "t_truk", filter: "Status=1 AND IdTruk != 'BA--002' AND IdTruk != '034-034' AND IdTruk != 'DDM-003' AND IdTruk != 'DDM-004'", sort: "NoTruk ASC" } })
      .subscribe(val => {
        let data = val['data']
        for (let i = 0; i < data.length; i++) {
          let dataa = data[i].IdTruk
          var url = 'http://10.10.10.88:3030/gps?nopol=' + data[i].NoTruk + '&baris=1'
          var link = url.replace(/\s+/g, '');
          console.log(link)
          this.readTextFile(link, function (text) {
            var datatruk = JSON.parse(text);
            if (datatruk.data.length > 0) {
              for (let j = 0; j < datatruk.data.length; j++) {
                let datalatlon = datatruk.data[j]
                self.doInsertLatLonTruck(datalatlon, dataa);
              }
            }
          });
        }
      });
  }
  doInsertLatLonTruck(datalatlon, dataa) {
    this.api.getLive("table/latlon", { params: { limit: 1000, filter: "id_truck='" + dataa + "' AND latitude =" + "'" + datalatlon.gps_latitude_real + "' AND longitude=" + "'" + datalatlon.gps_longitude_real + "'", sort: "datetime" + " DESC " } })
      .subscribe(val => {
        let data = val['data']
        if (data.length > 0) {
        }
        else {
          const headers = new HttpHeaders()
            .set("Content-Type", "application/json");
          this.api.getLive('nextno/latlon/id').subscribe(val => {
            let nextno = val['nextno'];
            this.api.postLive("table/latlon",
              {
                "id": nextno,
                "booking_no": '',
                "id_truck": dataa,
                "id_driver": '',
                "installer_1": '',
                "installer_2": '',
                "latitude": datalatlon.gps_latitude_real,
                "longitude": datalatlon.gps_longitude_real,
                "datetime": datalatlon.gps_datetime,
                "devices": 'GPS',
                "status": 'OPEN'
              },
              { headers })
              .subscribe(val => {
              }, err => {
                this.doInsertLatLonTruck(datalatlon, dataa)
              });
          }, err => {
            this.doInsertLatLonTruck(datalatlon, dataa)
          });
        }
      }, err => {
        this.doInsertLatLonTruck(datalatlon, dataa)
      });
  }
  doGetDataAsianGames2018() {
    var self = this
    var xhr = new XMLHttpRequest();
    this.readTextFile('https://www.vidio.com/live/playings.json', function (text) {
      var data = JSON.parse(text);
      console.log(data);
      console.log(data.livestreamings);
      self.api.get("table/z_channel", { params: { limit: 100, filter: "category='asiangames'" } })
        .subscribe(val => {
          let dataasiangames = val['data']
          console.log(dataasiangames)
          for (let i = 0; i < dataasiangames.length; i++) {
            self.doDeleteAsianGames2018()
          }
          if (data.livestreamings.length > 0) {
            for (let i = 0; i < data.livestreamings.length; i++) {
              let datagames = data.livestreamings[i]
              let datai = i
              console.log(datagames, datai)
              self.doInsertAsianGames2018(datagames, datai)
            }
          }
        });
    });
  }
  doDeleteAsianGames2018() {
    const headers = new HttpHeaders()
      .set("Content-Type", "application/json");
    this.api.delete("table/z_channel", { params: { filter: "category='asiangames'" }, headers })
      .subscribe(val => {
        console.log('ok')
      }, err => {
        this.doDeleteAsianGames2018();
      });
  }
  doInsertAsianGames2018(datagames, datai) {
    const headers = new HttpHeaders()
      .set("Content-Type", "application/json");
    let headtitle = datagames.campaign_text.substring(0, 33)
    let headtitle2 = datagames.campaign_text.substring(0, 23)
    let title;
    if (headtitle == 'Live Streaming Asian Games 2018 -' || headtitle == 'Live Streaming Asian Games 2018 :') {
      title = datagames.campaign_text.substring(34, 200)
    }
    else if (headtitle2 == 'Live Asian Games 2018 :' || headtitle2 == 'Live Asian Games 2018 -') {
      title = datagames.campaign_text.substring(24, 200)
    }
    else {
      title = datagames.campaign_text
    }
    this.api.get('nextno/z_channel/id').subscribe(val => {
      let nextno = val['nextno'];
      this.api.post("table/z_channel",
        {
          "id": nextno,
          "type": 'TV',
          "timer": 0,
          "name": 'TV Asian Games 2018',
          "country": 'Other',
          "category": 'asiangames',
          "title": title,
          "thumbnail_picture": datagames.image_url,
          "url": 'https://www.vidio.com' + datagames.url + "/embed?",
          "datetime": '1753-01-01 00:00',
          "status": 'OPEN',
          "date": '1753-01-01 00:00'
        },
        { headers })
        .subscribe(val => {
          console.log(datai)
        }, err => {
          this.doInsertAsianGames2018(datagames, datai)
        });
    }, err => {
      this.doInsertAsianGames2018(datagames, datai)
    });
  }
  readTextFilePlaylist(file, callback) {
    var rawFile = new XMLHttpRequest();
    rawFile.overrideMimeType("application/json");
    rawFile.open("GET", file, true);
    rawFile.onreadystatechange = function () {
      if (rawFile.readyState === 4) {
        callback(rawFile.responseText);
      }
    }
    rawFile.send(null);
  }
  readTextFilePlaylistItems(file, callback) {
    var rawFile = new XMLHttpRequest();
    rawFile.overrideMimeType("application/json");
    rawFile.open("GET", file, true);
    rawFile.onreadystatechange = function () {
      if (rawFile.readyState === 4) {
        callback(rawFile.responseText);
      }
    }
    rawFile.send(null);
  }
  doGetListChannel() {
    this.channellist = [];
    this.channellistplaylist = [];
    this.channellistplaylistitems = [];
    this.api.get("table/x_list_channel", { params: { filter: "status='OPEN'", limit: 100, sort: "name" + " ASC " } })
      .subscribe(val => {
        let data = val['data']
        var self = this;
        for (let i = 0; i < data.length; i++) {
          let datalistchannels = data[i]
          var dataurl = 'https://www.googleapis.com/youtube/v3/channels?part=snippet,contentDetails,statistics&id=' + data[i].id_channel + '&key=AIzaSyDiGAIrTptBJauVc6WfVVcMUZtu5AipATg'
          this.readTextFile(dataurl, function (text) {
            let datachannel = JSON.parse(text);
            self.channellist.push(datachannel['items'][0])
            let insertchannels = datachannel['items'][0]
            //self.doInsertChannels(insertchannels, datalistchannels)
            var dataurlplaylist = 'https://www.googleapis.com/youtube/v3/playlists?part=snippet,contentDetails&channelId=' + datachannel['items'][0].id + '&maxResults=50&key=AIzaSyDiGAIrTptBJauVc6WfVVcMUZtu5AipATg'
            self.readTextFilePlaylist(dataurlplaylist, function (text) {
              let datachannelplaylist = JSON.parse(text);
              for (let j = 0; j < datachannelplaylist.items.length; j++) {
                self.channellistplaylist.push(datachannelplaylist.items[j])
                let insertplaylist = datachannelplaylist.items[j]
                //self.doInsertPlaylist(insertplaylist, datalistchannels)
              }
            });
          });
        }
      }, err => {
        this.doGetListChannel();
      });
  }
  doGetPlaylistItems() {
    var self = this;
    this.api.get("table/x_playlist", { params: { limit: 1000, filter: "status='OPEN'" } })
      .subscribe(val => {
        let data = val['data']
        for (let i = 0; i < data.length; i++) {
          var dataurlplaylistitems = 'https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&playlistId=' + data[i].id_playlist + '&maxResults=50&key=AIzaSyDiGAIrTptBJauVc6WfVVcMUZtu5AipATg'
          this.readTextFilePlaylistItems(dataurlplaylistitems, function (text) {
            let datachannelplaylistitems = JSON.parse(text);
            for (let k = 0; k < datachannelplaylistitems.items.length; k++) {
              self.channellistplaylistitems.push(datachannelplaylistitems.items[k])
              let insertplaylistitems = datachannelplaylistitems.items[k]
              self.doInsertPlaylistItems(insertplaylistitems)
            }
          });
        }
        console.log(this.channellistplaylistitems.length)
      });
  }
  doInsertChannels(insertchannels, datalistchannels) {
    this.api.get("table/x_channels", { params: { limit: 1000, filter: "id_channel='" + insertchannels.id + "'" } })
      .subscribe(val => {
        let data = val['data']
        if (data.length == 0) {
          const headers = new HttpHeaders()
            .set("Content-Type", "application/json");
          this.api.get('nextno/x_channels/id').subscribe(val => {
            let nextno = val['nextno'];
            this.api.post("table/x_channels",
              {
                "id": nextno,
                "id_channel": insertchannels.id,
                "title_default": insertchannels.snippet.title,
                "title": datalistchannels.name,
                "thumbnails_default": insertchannels.snippet.thumbnails.default.url,
                "thumbnails_medium": insertchannels.snippet.thumbnails.medium.url,
                "thumbnails_high": insertchannels.snippet.thumbnails.high.url,
                "status": 'OPEN',
                "datetime": moment().format('YYYY-MM-DD HH:mm')
              },
              { headers })
              .subscribe(val => {
              }, err => {
                this.doInsertChannels(insertchannels, datalistchannels)
              });
          }, err => {
            this.doInsertChannels(insertchannels, datalistchannels)
          });
        }
      });
  }
  doInsertPlaylist(insertplaylist, datalistchannels) {
    this.api.get("table/x_playlist", { params: { limit: 1000, filter: "id_playlist='" + insertplaylist.id + "'" } })
      .subscribe(val => {
        let data = val['data']
        if (data && data.length == 0) {
          const headers = new HttpHeaders()
            .set("Content-Type", "application/json");
          this.api.get('nextno/x_playlist/id').subscribe(val => {
            let nextno = val['nextno'];
            this.api.post("table/x_playlist",
              {
                "id": nextno,
                "id_channel": insertplaylist.snippet.channelId,
                "id_playlist": insertplaylist.id,
                "title_playlist": insertplaylist.snippet.title,
                "thumbnails_default": '',
                "thumbnails_standard": '',
                "thumbnails_medium": insertplaylist.snippet.thumbnails.medium.url,
                "thumbnails_high": '',
                "thumbnails_maxres": '',
                "status": 'OPEN',
                "datetime": moment().format('YYYY-MM-DD HH:mm')
              },
              { headers })
              .subscribe(val => {
              }, err => {
                this.doInsertPlaylist(insertplaylist, datalistchannels)
              });
          }, err => {
            this.doInsertPlaylist(insertplaylist, datalistchannels)
          });
        }
      });
  }
  doInsertPlaylistItems(insertplaylistitems) {
    const headers = new HttpHeaders()
      .set("Content-Type", "application/json");
    this.api.get('nextno/x_playlist_items/id').subscribe(val => {
      let nextno = val['nextno'];
      this.api.post("table/x_playlist_items",
        {
          "id": nextno,
          "id_channel": insertplaylistitems.snippet.channelId,
          "id_playlist": insertplaylistitems.snippet.playlistId,
          "id_video": insertplaylistitems.snippet.resourceId.videoId,
          "title_video": insertplaylistitems.snippet.title,
          /*"thumbnails_default": insertplaylistitems.snippet.thumbnails.default.url,
          "thumbnails_standard": insertplaylistitems.snippet.thumbnails.standard.url,
          "thumbnails_medium": insertplaylistitems.snippet.thumbnails.medium.url,
          "thumbnails_high": insertplaylistitems.snippet.thumbnails.high.url,
          "thumbnails_maxres": insertplaylistitems.snippet.thumbnails.maxres.url,*/
          "thumbnails_default": '',
          "thumbnails_standard": '',
          "thumbnails_medium": '',
          "thumbnails_high": '',
          "thumbnails_maxres": '',
          "status": 'OPEN',
          "datetime": moment(insertplaylistitems.snippet.publishedAt).format('YYYY-MM-DD HH:mm')
        },
        { headers })
        .subscribe(val => {
        }, err => {
          this.doInsertPlaylistItems(insertplaylistitems)
        });
    }, err => {
      this.doInsertPlaylistItems(insertplaylistitems)
    });
  }
  readTextFileAPI(file, callback) {
    var rawFile = new XMLHttpRequest();
    rawFile.overrideMimeType("application/json");
    rawFile.open("GET", file, true);
    rawFile.onreadystatechange = function () {
      if (rawFile.readyState === 4) {
        callback(rawFile.responseText);
      }
    }
    rawFile.send(null);
  }
  doGetThumbnailPicture() {
    this.api.get("table/z_channel_stream", { params: { limit: 1000, filter: "tmdb_id='' OR tmdb_id IS NULL", sort: "id" + " DESC " } })
      .subscribe(val => {
        let data = val['data']
        for (let i = 0; i < data.length; i++) {
          let id = data[i].id
          let title = data[i].title_backup
          let thumbnail = data[i].thumbnail_picture_tmdb
          this.doGetAPIThumbnail(id, title, thumbnail)
        }
      }, err => {
        this.doGetThumbnailPicture()
      });
  }
  doGetThumbnailPictureImdb() {
    this.api.get("table/z_channel_stream", { params: { limit: 5000, filter: "imdb_id='' OR imdb_id IS NULL", sort: "id" + " DESC " } })
      .subscribe(val => {
        let data = val['data']
        for (let i = 0; i < data.length; i++) {
          let id = data[i].id
          let tmdb_id = data[i].tmdb_id
          this.doGetAPIDetailThumbnail(id, tmdb_id)
        }
      }, err => {
        this.doGetThumbnailPictureImdb()
      });
  }
  doGetThumbnailPictureOmdb() {
    this.api.get("table/z_channel_stream", { params: { limit: 1000, filter: "imdb_id !='' AND (imdb_title = '' OR imdb_title IS NULL)", sort: "id" + " DESC " } })
      .subscribe(val => {
        let data = val['data']
        for (let i = 0; i < data.length; i++) {
          let id = data[i].id
          let imdb = data[i].imdb_id
          this.doGetAPIDetailThumbnailOmdb(id, imdb)
        }
      }, err => {
        this.doGetThumbnailPictureOmdb()
      });
  }
  doGetThumbnailPictureTmdb() {
    this.api.get("table/z_channel_stream", { params: { limit: 5000, filter: "imdb_id = '' AND tmdb_id != '0' AND imdb_title = ''", sort: "id" + " DESC " } })
      .subscribe(val => {
        let data = val['data']
        for (let i = 0; i < data.length; i++) {
          let id = data[i].id
          let tmdb = data[i].tmdb_id
          this.doGetAPIDetailThumbnailTmdb(id, tmdb)
        }
      }, err => {
        this.doGetThumbnailPictureTmdb()
      });
  }
  doGetAPIThumbnail(id, title, thumbnail) {
    var self = this;
    var dataurlapi = 'https://api.themoviedb.org/3/search/multi?api_key=bce811802b12ad5bd1f01b5f17bf4ff3&language=en-US&query=' + title + '&page=1&include_adult=true'
    this.readTextFileAPI(dataurlapi, function (text) {
      let datamovies = JSON.parse(text);
      if (datamovies.length != 0) {
        if (datamovies.results.length != 0) {
          for (let i = 0; i < datamovies.results.length; i++) {
            if (datamovies.results[i].poster_path == thumbnail) {
              let tmdb_id = datamovies.results[i].id
              self.updatethumbnail(id, tmdb_id)
            }
            else {
              if (datamovies.results[i].title == title) {
                let tmdb_id = datamovies.results[i].id
                self.updatethumbnail(id, tmdb_id)
              }
              else {
                let tmdb_id = datamovies.results[0].id
                self.updatethumbnail(id, tmdb_id)
              }
            }
          }
        }
      }
    });
  }
  doGetAPIDetailThumbnail(id, tmdb_id) {
    var self = this;
    var dataurlapidetail = 'https://api.themoviedb.org/3/movie/' + tmdb_id + '?api_key=bce811802b12ad5bd1f01b5f17bf4ff3&language=en-US'
    this.readTextFileAPI(dataurlapidetail, function (text) {
      let datadetailmovies = JSON.parse(text);
      let imdb_id = datadetailmovies.imdb_id
      console.log(id, datadetailmovies)
      self.updatedetailthumbnailimdb(id, imdb_id)
    });
  }
  doGetAPIDetailThumbnailOmdb(id, imdb) {
    var self = this;
    var dataurlapidetail = 'http://www.omdbapi.com/?i=' + imdb + '&plot=full&apikey=10f4ab83'
    this.readTextFileAPI(dataurlapidetail, function (text) {
      let datadetailmovies = JSON.parse(text);
      //console.log(datadetailmovies)
      self.updatedetailthumbnailOmdb(id, imdb, datadetailmovies)
    });
  }
  doGetAPIDetailThumbnailTmdb(id, tmdb_id) {
    var self = this;
    var dataurlapidetail = 'https://api.themoviedb.org/3/movie/' + tmdb_id + '?api_key=bce811802b12ad5bd1f01b5f17bf4ff3&language=en-US'
    this.readTextFileAPI(dataurlapidetail, function (text) {
      let datadetailmovies = JSON.parse(text);
      console.log(id, datadetailmovies)
      let genres = [];
      let name: any;
      let genresstr: any;
      if (datadetailmovies.genres) {
        for (let i = 0; i < datadetailmovies.genres.length; i++) {
          genres.push(datadetailmovies.genres[i].name)
        }
      }
      if (genres.length) {
        genresstr = genres.toString()
      }
      else {
        genresstr = 'Others'
      }
      if (datadetailmovies.production_countries) {
        if (datadetailmovies.production_countries.length > 0) {
          name = datadetailmovies.production_countries[0].name
        }
        else {
          name = 'Others'
        }
      }
      self.updatedetailthumbnailtmdb(id, datadetailmovies, genresstr, name)
    });
  }
  doGetAPIGenres() {
    var self = this;
    var dataurlapidetail = 'https://api.themoviedb.org/3/genre/movie/list?api_key=bce811802b12ad5bd1f01b5f17bf4ff3&language=en-US'
    this.readTextFileAPI(dataurlapidetail, function (text) {
      let datagenres = JSON.parse(text);
      for (let i = 0; i < datagenres.genres.length; i++) {
        let data = datagenres.genres[i]
        self.updategenres(data)
      }
    });
  }
  updategenres(data) {
    console.log(data)
    const headers = new HttpHeaders()
      .set("Content-Type", "application/json");
    this.api.post("table/z_genres",
      {
        "id": data.id,
        "name": data.name
      },
      { headers })
      .subscribe(val => {
      }, err => {
        this.updategenres(data)
      });
  }
  updatedetailthumbnailimdb(id, imdb_id) {
    console.log(id, imdb_id)
    const headers = new HttpHeaders()
      .set("Content-Type", "application/json");
    this.api.put("table/z_channel_stream",
      {
        "id": id,
        "imdb_id": imdb_id
      },
      { headers })
      .subscribe(val => {
      }, err => {
        this.updatedetailthumbnailimdb(id, imdb_id)
      });
  }
  updatedetailthumbnail(id, tmdb_id, imdb_id) {
    const headers = new HttpHeaders()
      .set("Content-Type", "application/json");
    this.api.put("table/z_channel_stream",
      {
        "id": id,
        "tmdb_id": tmdb_id,
        "imdb_id": imdb_id
      },
      { headers })
      .subscribe(val => {
      }, err => {
        this.updatedetailthumbnail(id, tmdb_id, imdb_id)
      });
  }
  updatedetailthumbnailOmdb(id, imdb, datadetailmovies) {
    const headers = new HttpHeaders()
      .set("Content-Type", "application/json");
    this.api.put("table/z_channel_stream",
      {
        "id": id,
        "imdb_title": datadetailmovies.Title,
        "imdb_year": datadetailmovies.Year,
        "imdb_released": datadetailmovies.Released,
        "imdb_genre": datadetailmovies.Genre,
        "imdb_director": datadetailmovies.Director,
        "imdb_writer": datadetailmovies.Writer,
        "imdb_actors": datadetailmovies.Actors,
        "imdb_plot": datadetailmovies.Plot,
        "imdb_language": datadetailmovies.Language,
        "imdb_country": datadetailmovies.Country,
        "imdb_poster": datadetailmovies.Poster,
        "imdb_rating": datadetailmovies.imdbRating,
        "imdb_type": datadetailmovies.Type,
        "imdb_production": datadetailmovies.Production,
        "imdb_runtime": datadetailmovies.Runtime
      },
      { headers })
      .subscribe(val => {
      }, err => {
        this.updatedetailthumbnailOmdb(id, imdb, datadetailmovies)
      });
  }
  updatedetailthumbnailtmdb(id, datadetailmovies, genresstr, name) {
    console.log(id, datadetailmovies, genresstr, name)
    const headers = new HttpHeaders()
      .set("Content-Type", "application/json");
    this.api.put("table/z_channel_stream",
      {
        "id": id,
        "imdb_title": datadetailmovies.title,
        "imdb_year": datadetailmovies.release_date,
        "imdb_released": datadetailmovies.release_date,
        "imdb_genre": genresstr,
        "imdb_director": 'N/A',
        "imdb_writer": 'N/A',
        "imdb_actors": 'N/A',
        "imdb_plot": datadetailmovies.overview,
        "imdb_language": name,
        "imdb_country": name,
        "imdb_poster": 'https://image.tmdb.org/t/p/w185' + datadetailmovies.poster_path,
        "imdb_rating": 'N/A',
        "imdb_type": 'N/A',
        "imdb_production": 'N/A',
        "imdb_runtime": datadetailmovies.runtime + ' min'
      },
      { headers })
      .subscribe(val => {
      }, err => {
        this.updatedetailthumbnailtmdb(id, datadetailmovies, genresstr, name)
      });
  }
  updatethumbnail(id, tmdb_id) {
    const headers = new HttpHeaders()
      .set("Content-Type", "application/json");
    this.api.put("table/z_channel_stream",
      {
        "id": id,
        "tmdb_id": tmdb_id
      },
      { headers })
      .subscribe(val => {
      }, err => {
        this.updatethumbnail(id, tmdb_id)
      });
  }
  doUpdateDrive(id, idstream, iddrive, drive) {
    const headers = new HttpHeaders()
      .set("Content-Type", "application/json");
    this.api.put("table/z_channel_stream_url",
      {
        "id": id,
        "stream": '0',
        "xml": '',
        "plugin": '1',
        "exo": '1',
        "id_gd": iddrive,
        "url": drive,
        "status": 'OPEN'
      },
      { headers })
      .subscribe(val => {
        this.doUpdateDriveStream(idstream, iddrive, drive)
      }, err => {
        this.doUpdateDrive(id, idstream, iddrive, drive)
      });
  }
  doUpdateDriveStream(idstream, iddrive, drive) {
    const headers = new HttpHeaders()
      .set("Content-Type", "application/json");
    this.api.put("table/z_channel_stream",
      {
        "id": idstream,
        "stream": '0',
        "xml": '',
        "plugin": '1',
        "exo": '1',
        "url": drive,
        "status": 'OPEN'
      },
      { headers })
      .subscribe(val => {
      }, err => {
        this.doUpdateDriveStream(idstream, iddrive, drive)
      });
  }
  doGetDrive() {
    var self = this;
    return gapi.auth2.getAuthInstance()
      .signIn({ scope: "https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/drive.appdata https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.metadata https://www.googleapis.com/auth/drive.metadata.readonly https://www.googleapis.com/auth/drive.photos.readonly https://www.googleapis.com/auth/drive.readonly" })
      .then(function () {
        return gapi.client.load("https://content.googleapis.com/discovery/v1/apis/drive/v3/rest")
          .then(function () {
            return gapi.client.drive.files.list({
              "pageSize": 1000,
              "q": "mimeType = 'video/mp4'"
            })
              .then(function (response) {
                // Handle the results here (response.result has the parsed body).
                console.log(response.result.files)
                for (let i = 0; i < response.result.files.length; i++) {
                  self.api.get("table/z_channel_stream_url", { params: { limit: 10, filter: "id_channel=" + "'" + response.result.files[i].name.substring(0, 6) + "' AND quality='Server GD'", sort: "id" + " DESC " } })
                    .subscribe(val => {
                      let data = val['data']
                      let id = data[0].id
                      let idstream = response.result.files[i].name.substring(0, 6)
                      let iddrive = response.result.files[i].id
                      let drive = 'https://www.googleapis.com/drive/v3/files/' + response.result.files[i].id + '?alt=media&key=AIzaSyD2-t8phykckTFggOTVEwxYIw5A8yoI4Ks'
                      self.doUpdateDrive(id, idstream, iddrive, drive)
                    });
                }
              },
                function (err) { console.error("Execute error", err); });
          },
            function (err) { console.error("Error loading GAPI client for API", err); });
      },
        function (err) { console.error("Error signing in", err); });
  }
  readTextFileJSON(file, callback) {
    var rawFile = new XMLHttpRequest();
    rawFile.overrideMimeType("application/json");
    rawFile.open("GET", file, true);
    rawFile.onreadystatechange = function () {
      if (rawFile.readyState === 4) {
        callback(rawFile.responseText);
      }
    }
    rawFile.send(null);
  }
  doGetJson() {
    this.api.get("table/z_scan_loop", { params: { limit: 10, filter: "name='MOVIES'" } })
      .subscribe(val => {
        let data = val['data']
        for (let i = data[0].start_scan; i <= data[0].finish_scan; i++) {
          this.doGetListLink(i)
        }
      });
  }
  doGetJsonURL() {
    this.api.get("table/z_channel_stream_temp_url", { params: { limit: 1000, filter: "status = 'OPEN'" } })
      .subscribe(val => {
        let data = val['data']
        for (let j = 0; j < data.length; j++) {
          let url = data[j].url
          this.doGetListLinkURL(url)
        }
      });
  }
  doGetListLinkURL(url) {
    var dataurlapi = url
    var self = this
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function () {
      if (xhr.readyState == XMLHttpRequest.DONE) {
        if (xhr.status == 200) {
          var str = xhr.responseText
          var titleweb = str.search('Filmapik Nonton Film Streaming Movie Layarkaca21 Lk21 Dunia21 Bioskop Cinema 21 Box Office Subtitle Indonesia Gratis Online Download - Filmapik');
          if (titleweb == -1) {
            var starturl = str.search('link rel="canonical" href=')
            var endurl = str.search('<meta property="og:image"')
            var endurlseries = str.search('<meta property="og:type"')
            var starttitle = str.search('<h3 itemprop="name">')
            var endtitle = str.search('</h3>')
            var startqualiity = str.search('<span class="quality">')
            var endquality = str.search('</span></p><p><strong>Release:')
            var starttrailer = str.search('https://www.youtube.com/embed/')
            var endtrailer = str.search('" title="Nonton Cuplikan')
            var startthumbnail = str.search('itemprop="thumbnailUrl" conTent="')
            var endthumbnail = str.search('<!-- Micro data -->')
            var endid = str.search('<style type="text/css">')
            var title = str.substring(starttitle + 20, endtitle - 6)
            var quality = str.substring(startqualiity + 22, endquality)
            var thumbnail = str.substring(startthumbnail + 33, endthumbnail - 4)
            var i = str.substring(endid - 11, endid - 5)
            var trailer = ''
            var country = ''
            var url = ''
            if (endurl != -1) {
              url = str.substring(starturl + 27, endurl - 5)
              if (starttrailer == -1) {
                trailer = ''
              }
              else {
                trailer = 'https://www.youtube.com/watch?v=' + str.substring(starttrailer + 30, endtrailer)
              }
              if (str.search('India</a></p></div>') != -1) {
                country = 'India'
              }
              else if (str.search('Hong Kong</a></p></div>') != -1) {
                country = 'Mandarin'
              }
              else if (str.search('Thailand</a></p></div>') != -1) {
                country = 'Thailand'
              }
              else if (str.search('Japan</a></p></div>') != -1) {
                country = 'Jepang'
              }
              else if (str.search('South Korea</a></p></div>') != -1) {
                country = 'Korea'
              }
              else {
                country = 'Barat'
              }
              self.readTextFileJSON(url + '/play/', function (text) {
                var starturlvideo = text.search('https://efek.stream/playing')
                var endurlvideo = text.search('" width="100%"')
                var startthumbnailurlvideo = text.search('https://image.tmdb.org/t/p/w185/')
                var urlvideo = text.substring(starturlvideo, endurlvideo)
                var thumbnailurlvideo = text.substring(startthumbnailurlvideo, startthumbnailurlvideo + 63)
                var reload = 0;
                const headers = new HttpHeaders()
                  .set("Content-Type", "application/json");
                self.api.put("table/z_channel_stream_temp_url",
                  {
                    "url": url + '/',
                    "status": 'CLSD'
                  },
                  { headers })
                  .subscribe(val => {
                  });
                self.doPostListLink(i, title, quality, url, urlvideo, trailer, country, thumbnail, thumbnailurlvideo, reload)
              });
            }
          }
        } else {
          self.doGetListLinkURL(url)
        }
      }
    }
    xhr.onerror = function () {

    };
    xhr.open('GET', dataurlapi, true);
    xhr.send(null);
  }
  doGetListLink(i) {
    var dataurlapi = 'https://filmapik.info/?p=' + i
    var self = this
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function () {
      if (xhr.readyState == XMLHttpRequest.DONE) {
        if (xhr.status == 200) {
          var str = xhr.responseText
          var titleweb = str.search('Filmapik Nonton Film Streaming Movie Layarkaca21 Lk21 Dunia21 Bioskop Cinema 21 Box Office Subtitle Indonesia Gratis Online Download - Filmapik');
          if (titleweb == -1) {
            var starturl = str.search('link rel="canonical" href=')
            var endurl = str.search('<meta property="og:image"')
            var endurlseries = str.search('<meta property="og:type"')
            var starttitle = str.search('<h3 itemprop="name">')
            var endtitle = str.search('</h3>')
            var startqualiity = str.search('<span class="quality">')
            var endquality = str.search('</span></p><p><strong>Release:')
            var starttrailer = str.search('https://www.youtube.com/embed/')
            var endtrailer = str.search('" title="Nonton Cuplikan')
            var startthumbnail = str.search('itemprop="thumbnailUrl" conTent="')
            var endthumbnail = str.search('<!-- Micro data -->')
            var title = str.substring(starttitle + 20, endtitle - 6)
            var quality = str.substring(startqualiity + 22, endquality)
            var thumbnail = str.substring(startthumbnail + 33, endthumbnail - 4)
            var trailer = ''
            var country = ''
            var url = ''
            if (endurl != -1) {
              url = str.substring(starturl + 27, endurl - 6)
              if (starttrailer == -1) {
                trailer = ''
              }
              else {
                trailer = 'https://www.youtube.com/watch?v=' + str.substring(starttrailer + 30, endtrailer)
              }
              if (str.search('India</a></p></div>') != -1) {
                country = 'India'
              }
              else if (str.search('Hong Kong</a></p></div>') != -1) {
                country = 'Mandarin'
              }
              else if (str.search('Thailand</a></p></div>') != -1) {
                country = 'Thailand'
              }
              else if (str.search('Japan</a></p></div>') != -1) {
                country = 'Jepang'
              }
              else if (str.search('South Korea</a></p></div>') != -1) {
                country = 'Korea'
              }
              else {
                country = 'Barat'
              }
              self.readTextFileJSON(url + '/play/', function (text) {
                var starturlvideo = text.search('https://efek.stream/playing')
                var endurlvideo = text.search('" width="100%"')
                var startthumbnailurlvideo = text.search('https://image.tmdb.org/t/p/w185/')
                var urlvideo = text.substring(starturlvideo, endurlvideo)
                var thumbnailurlvideo = text.substring(startthumbnailurlvideo, startthumbnailurlvideo + 63)
                var reload = 0;
                self.doPostListLink(i, title, quality, url, urlvideo, trailer, country, thumbnail, thumbnailurlvideo, reload)
              });
            }
          }
        } else {
          self.doGetListLink(i)
        }
      }
    }
    xhr.onerror = function () {

    };
    xhr.open('GET', dataurlapi, true);
    xhr.send(null);
  }
  doPostListLink(i, title, quality, url, urlvideo, trailer, country, thumbnail, thumbnailurlvideo, reload) {
    const headers = new HttpHeaders()
      .set("Content-Type", "application/json");
    this.api.post("table/z_channel_stream_temp",
      {
        "id": i,
        "title": title,
        "quality": quality,
        "url": url,
        "url_video": urlvideo,
        "trailer": trailer,
        "country": country,
        "thumbnail": thumbnail,
        "thumbnail_tmdb": thumbnailurlvideo,
        "status": 'OPEN',
        "datetime": moment().format('YYYY-MM-DD HH:mm')
      },
      { headers })
      .subscribe(val => {
      }, err => {
        if (reload < 3) {
          reload = reload + 1
          this.doPostListLink(i, title, quality, url, urlvideo, trailer, country, thumbnail, thumbnailurlvideo, reload)
        }
      });
  }
  doGetUrlErrorDOCTYPE() {
    this.api.get("table/z_channel_stream_temp", { params: { filter: "url LIKE '%DOCTYPE%' AND status = 'OPEN'", limit: 100 } })
      .subscribe(val => {
        let data = val['data']
        for (let i = 0; i < data.length; i++) {
          let id = data[i].id
          this.doGetListLinkErrorDOCTYPE(id)
        }
      });
  }
  doGetListLinkErrorDOCTYPE(id) {
    var dataurlapi = 'https://filmapik.info/?p=' + id
    var self = this
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function () {
      if (xhr.readyState == XMLHttpRequest.DONE) {
        if (xhr.status == 200) {
          var str = xhr.responseText
          var titleweb = str.search('Filmapik Nonton Film Streaming Movie Layarkaca21 Lk21 Dunia21 Bioskop Cinema 21 Box Office Subtitle Indonesia Gratis Online Download - Filmapik');
          if (titleweb == -1) {
            var starturl = str.search('link rel="canonical" href=')
            var endurl = str.search('<meta property="og:image"')
            var endurlseries = str.search('<meta property="og:type"')
            var starttitle = str.search('<h3 itemprop="name">')
            var endtitle = str.search('</h3>')
            var startqualiity = str.search('<span class="quality">')
            var endquality = str.search('</span></p><p><strong>Release:')
            var starttrailer = str.search('https://www.youtube.com/embed/')
            var endtrailer = str.search('" title="Nonton Cuplikan')
            var startthumbnail = str.search('itemprop="thumbnailUrl" conTent="')
            var endthumbnail = str.search('<!-- Micro data -->')
            var title = str.substring(starttitle + 20, endtitle - 6)
            var quality = str.substring(startqualiity + 22, endquality)
            var thumbnail = str.substring(startthumbnail + 33, endthumbnail - 4)
            var trailer = ''
            var country = ''
            var url = ''
            if (endurlseries != -1) {
              url = str.substring(starturl + 27, endurlseries - 6)
              if (starttrailer == -1) {
                trailer = ''
              }
              else {
                trailer = 'https://www.youtube.com/watch?v=' + str.substring(starttrailer + 30, endtrailer)
              }
              if (str.search('India</a></p></div>') != -1) {
                country = 'India'
              }
              else if (str.search('Hong Kong</a></p></div>') != -1) {
                country = 'Mandarin'
              }
              else if (str.search('Thailand</a></p></div>') != -1) {
                country = 'Thailand'
              }
              else if (str.search('Japan</a></p></div>') != -1) {
                country = 'Jepang'
              }
              else if (str.search('South Korea</a></p></div>') != -1) {
                country = 'Korea'
              }
              else {
                country = 'Barat'
              }
              self.readTextFileJSON(url + '/play/', function (text) {
                var starturlvideo = text.search('https://efek.stream/playing')
                var endurlvideo = text.search('" width="100%"')
                var startthumbnailurlvideo = text.search('https://image.tmdb.org/t/p/w185/')
                var urlvideo = text.substring(starturlvideo, endurlvideo)
                var thumbnailurlvideo = text.substring(startthumbnailurlvideo, startthumbnailurlvideo + 63)
                var reload = 0;
                self.doPutListLinkErrorDOCTYPE(id, title, quality, url, urlvideo, trailer, country, thumbnail, thumbnailurlvideo, reload)
              });
            }
          }
        } else {
          self.doGetListLinkErrorDOCTYPE(id)
        }
      }
    }
    xhr.onerror = function () {

    };
    xhr.open('GET', dataurlapi, true);
    xhr.send(null);
  }
  doPutListLinkErrorDOCTYPE(id, title, quality, url, urlvideo, trailer, country, thumbnail, thumbnailurlvideo, reload) {
    const headers = new HttpHeaders()
      .set("Content-Type", "application/json");
    this.api.put("table/z_channel_stream_temp",
      {
        "id": id,
        "title": title,
        "quality": quality,
        "url": url,
        "url_video": urlvideo,
        "trailer": trailer,
        "country": country,
        "thumbnail": thumbnail,
        "thumbnail_tmdb": thumbnailurlvideo,
        "status": 'OPEN',
        "datetime": moment().format('YYYY-MM-DD HH:mm')
      },
      { headers })
      .subscribe(val => {
      }, err => {
        if (reload < 3) {
          reload = reload + 1
          this.doPutListLinkErrorDOCTYPE(id, title, quality, url, urlvideo, trailer, country, thumbnail, thumbnailurlvideo, reload)
        }
      });
  }
  doGetUrlVideoError() {
    this.api.get("table/z_channel_stream_temp", { params: { filter: "url_video = '' AND status = 'OPEN'", limit: 1000 } })
      .subscribe(val => {
        let data = val['data']
        for (let i = 0; i < data.length; i++) {
          let id = data[i].id
          let url = data[i].url
          this.doGetListLinkVideoError(id, url)
        }
      });
  }
  doGetListLinkVideoError(id, url) {
    var dataurlapi = url + '/play'
    var self = this
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function () {
      if (xhr.readyState == XMLHttpRequest.DONE) {
        if (xhr.status == 200) {
          var str = xhr.responseText
          var titleweb = str.search('Filmapik Nonton Film Streaming Movie Layarkaca21 Lk21 Dunia21 Bioskop Cinema 21 Box Office Subtitle Indonesia Gratis Online Download - Filmapik');
          if (titleweb == -1) {
            var starturlvideo = xhr.responseText.search('https://efek.stream/playing')
            var endurlvideo = xhr.responseText.search('" width="100%"')
            var startthumbnailurlvideo = xhr.responseText.search('https://image.tmdb.org/t/p/w185/')
            var urlvideo = xhr.responseText.substring(starturlvideo, endurlvideo)
            var thumbnailurlvideo = xhr.responseText.substring(startthumbnailurlvideo, startthumbnailurlvideo + 63)
            var reload = 0;
            self.doPutListLinkVideoError(id, urlvideo, thumbnailurlvideo, reload)
          }
        } else {
          self.doGetListLinkVideoError(id, url)
        }
      }
    }
    xhr.onerror = function () {

    };
    xhr.open('GET', dataurlapi, true);
    xhr.send(null);
  }
  doPutListLinkVideoError(id, urlvideo, thumbnailurlvideo, reload) {
    const headers = new HttpHeaders()
      .set("Content-Type", "application/json");
    this.api.put("table/z_channel_stream_temp",
      {
        "id": id,
        "url_video": urlvideo,
        "thumbnail_tmdb": thumbnailurlvideo,
        "status": 'OPEN',
        "datetime": moment().format('YYYY-MM-DD HH:mm')
      },
      { headers })
      .subscribe(val => {
      }, err => {
        if (reload < 3) {
          reload = reload + 1
          this.doPutListLinkVideoError(id, urlvideo, thumbnailurlvideo, reload)
        }
      });
  }
  doGetUrl720() {
    this.api.get("table/z_channel_stream_temp", { params: { filter: "url_video_720 = '' AND status = 'OPEN'", limit: 1000 } })
      .subscribe(val => {
        let data = val['data']
        for (let i = 0; i < data.length; i++) {
          let id = data[i].id
          let url = data[i].url
          this.doGetListLink720(id, url)
        }
      });
  }
  doGetListLink720(id, url) {
    var dataurlapi = url + '/play/720'
    var self = this
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function () {
      if (xhr.readyState == XMLHttpRequest.DONE) {
        if (xhr.status == 200) {
          var str = xhr.responseText
          var titleweb = str.search('Filmapik Nonton Film Streaming Movie Layarkaca21 Lk21 Dunia21 Bioskop Cinema 21 Box Office Subtitle Indonesia Gratis Online Download - Filmapik');
          if (titleweb == -1) {
            var starturlvideo = xhr.responseText.search('https://efek.stream/playing')
            var endurlvideo = xhr.responseText.search('" width="100%"')
            var urlvideo = xhr.responseText.substring(starturlvideo, endurlvideo)
            var reload = 0;
            self.doPutListLink720(id, urlvideo, reload)
          }
        } else {
          self.doGetListLink720(id, url)
        }
      }
    }
    xhr.onerror = function () {

    };
    xhr.open('GET', dataurlapi, true);
    xhr.send(null);
  }
  doPutListLink720(id, urlvideo, reload) {
    const headers = new HttpHeaders()
      .set("Content-Type", "application/json");
    this.api.put("table/z_channel_stream_temp",
      {
        "id": id,
        "url_video_720": urlvideo,
        "status": 'OPEN',
        "datetime": moment().format('YYYY-MM-DD HH:mm')
      },
      { headers })
      .subscribe(val => {
      }, err => {
        if (reload < 3) {
          reload = reload + 1
          this.doPutListLink720(id, urlvideo, reload)
        }
      });
  }
  doGetUrlGoogle() {
    this.api.get("table/z_channel_stream_temp", { params: { filter: "url_video_google = '' AND status = 'OPEN'", limit: 5000 } })
      .subscribe(val => {
        let data = val['data']
        for (let i = 0; i < data.length; i++) {
          let id = data[i].id
          let url = data[i].url_video
          this.doGetListLinkGoogle(id, url)
        }
      });
  }
  doGetUrlUpdateGoogle() {
    this.api.get("table/z_channel_stream_temp", { params: { filter: "url_video_google != '' AND status = 'OPEN'", limit: 20000 } })
      .subscribe(val => {
        let data = val['data']
        for (let i = 0; i < data.length; i++) {
          let id = data[i].id
          let url = data[i].url_video
          this.doGetListLinkGoogle(id, url)
        }
      });
  }
  doGetListLinkGoogle(id, url) {
    var dataurlapi = url
    var self = this
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function () {
      if (xhr.readyState == XMLHttpRequest.DONE) {
        if (xhr.status == 200) {
          var str = xhr.responseText
          var titleweb = str.search('Filmapik Nonton Film Streaming Movie Layarkaca21 Lk21 Dunia21 Bioskop Cinema 21 Box Office Subtitle Indonesia Gratis Online Download - Filmapik');
          if (titleweb == -1) {
            var starturlvideo = xhr.responseText.search('https://doc-')
            var endurlvideo = xhr.responseText.search('d"}]')
            var urlvideo = xhr.responseText.substring(starturlvideo, endurlvideo + 1)
            var reload = 0;
            self.doPutListLinkGoogle(id, urlvideo, reload)
          }
        } else {
          self.doGetListLinkGoogle(id, url)
        }
      }
    }
    xhr.onerror = function () {

    };
    xhr.open('GET', dataurlapi, true);
    xhr.send(null);
  }
  doPutListLinkGoogle(id, urlvideo, reload) {
    const headers = new HttpHeaders()
      .set("Content-Type", "application/json");
    this.api.put("table/z_channel_stream_temp",
      {
        "id": id,
        "url_video_google": urlvideo,
        "status": 'OPEN',
        "datetime": moment().format('YYYY-MM-DD HH:mm')
      },
      { headers })
      .subscribe(val => {
      }, err => {
        if (reload < 3) {
          reload = reload + 1
          this.doPutListLinkGoogle(id, urlvideo, reload)
        }
      });
  }
  doGetUrlGoogle720() {
    this.api.get("table/z_channel_stream_temp", { params: { filter: "url_video_google_720 = '' AND status = 'OPEN'", limit: 5000 } })
      .subscribe(val => {
        let data = val['data']
        for (let i = 0; i < data.length; i++) {
          let id = data[i].id
          let url = data[i].url_video_720
          this.doGetListLinkGoogle720(id, url)
        }
      });
  }
  doGetUrlUpdateGoogle720() {
    this.api.get("table/z_channel_stream_temp", { params: { filter: "url_video_google_720 != '' AND status = 'OPEN'", limit: 20000 } })
      .subscribe(val => {
        let data = val['data']
        for (let i = 0; i < data.length; i++) {
          let id = data[i].id
          let url = data[i].url_video_720
          this.doGetListLinkGoogle720(id, url)
        }
      });
  }
  doGetListLinkGoogle720(id, url) {
    var dataurlapi = url
    var self = this
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function () {
      if (xhr.readyState == XMLHttpRequest.DONE) {
        if (xhr.status == 200) {
          var str = xhr.responseText
          var titleweb = str.search('Filmapik Nonton Film Streaming Movie Layarkaca21 Lk21 Dunia21 Bioskop Cinema 21 Box Office Subtitle Indonesia Gratis Online Download - Filmapik');
          if (titleweb == -1) {
            var starturlvideo = xhr.responseText.search('https://doc-')
            var endurlvideo = xhr.responseText.search('d"}]')
            var urlvideo = xhr.responseText.substring(starturlvideo, endurlvideo + 1)
            var reload = 0;
            self.doPutListLinkGoogle720(id, urlvideo, reload)
          }
        } else {
          self.doGetListLinkGoogle720(id, url)
        }
      }
    }
    xhr.onerror = function () {

    };
    xhr.open('GET', dataurlapi, true);
    xhr.send(null);
  }
  doPutListLinkGoogle720(id, urlvideo, reload) {
    const headers = new HttpHeaders()
      .set("Content-Type", "application/json");
    this.api.put("table/z_channel_stream_temp",
      {
        "id": id,
        "url_video_google_720": urlvideo,
        "status": 'OPEN',
        "datetime": moment().format('YYYY-MM-DD HH:mm')
      },
      { headers })
      .subscribe(val => {
      }, err => {
        if (reload < 3) {
          reload = reload + 1
          this.doPutListLinkGoogle720(id, urlvideo, reload)
        }
      });
  }
  doGettoStream() {
    this.api.get("table/z_channel_stream_temp", { params: { limit: 1000, filter: "(url_video != '' OR url_video_720 != '') AND status = 'OPEN'" } })
      .subscribe(val => {
        let data = val['data']
        for (let i = 0; i < data.length; i++) {
          let dataget = data[i]
          this.doPosttoStream(dataget)
        }
      });
  }
  doPosttoStream(dataget) {
    this.getNextNo().subscribe(val => {
      let nextno = val['nextno'];
      const headers = new HttpHeaders()
        .set("Content-Type", "application/json");
      this.api.post("table/z_channel_stream",
        {
          "id": nextno,
          "type": 'STREAM',
          "stream": '',
          "xml": '',
          "plugin": '',
          "exo": '',
          "thumbnail_picture": dataget.thumbnail_tmdb,
          "name": 'Film ' + dataget.country,
          "country": dataget.country,
          "genre": null,
          "title": dataget.title + " (" + dataget.quality + ")",
          "title_backup": dataget.title,
          "quality_backup": dataget.quality,
          "trailer": dataget.trailer,
          "url": dataget.url_video,
          "status": '',
          "status_2": '',
          "date": moment().format('YYYY-MM-DD HH:mm:ss')
        },
        { headers })
        .subscribe(val => {
          if (dataget.url_video != '') {
            this.doPosttoStream360(dataget, nextno)
          }
          else {
            this.doPosttoStream720(dataget, nextno)
          }
        }, (err) => {
          this.doPosttoStream(dataget)
        })
    });
  }
  doPosttoStream360(dataget, nextno) {
    this.getNextNoUrl().subscribe(val => {
      let nextnourl = val['nextno'];
      const headers = new HttpHeaders()
        .set("Content-Type", "application/json");
      this.api.post("table/z_channel_stream_url",
        {
          "id": nextnourl,
          "id_channel": nextno,
          "type": 'STREAM',
          "stream": '',
          "xml": '',
          "plugin": '',
          "exo": '',
          "thumbnail_picture": dataget.thumbnail_tmdb,
          "name": 'Film ' + dataget.country,
          "country": dataget.country,
          "genre": null,
          "title": dataget.title + " (" + dataget.quality + ")",
          "quality": 'Server ES (360p)',
          "trailer": dataget.trailer,
          "url": dataget.url_video,
          "status": '',
          "status_2": '',
          "date": moment().format('YYYY-MM-DD HH:mm:ss'),
        },
        { headers })
        .subscribe(val => {
          if (dataget.url_video_720 != '') {
            this.doPosttoStream720(dataget, nextno)
          }
          else {
            this.doClsdServerTemp(dataget)
          }
        }, (err) => {
          this.doPosttoStream360(dataget, nextno)
        })
    });
  }
  doPosttoStream720(dataget, nextno) {
    this.getNextNoUrl().subscribe(val => {
      let nextnourl = val['nextno'];
      const headers = new HttpHeaders()
        .set("Content-Type", "application/json");
      this.api.post("table/z_channel_stream_url",
        {
          "id": nextnourl,
          "id_channel": nextno,
          "type": 'STREAM',
          "stream": '',
          "xml": '',
          "plugin": '',
          "exo": '',
          "thumbnail_picture": dataget.thumbnail_tmdb,
          "name": 'Film ' + dataget.country,
          "country": dataget.country,
          "genre": null,
          "title": dataget.title + " (" + dataget.quality + ")",
          "quality": 'Server ES (720p)',
          "trailer": dataget.trailer,
          "url": dataget.url_video_720,
          "status": '',
          "status_2": '',
          "date": moment().format('YYYY-MM-DD HH:mm:ss'),
        },
        { headers })
        .subscribe(val => {
          this.doClsdServerTemp(dataget)
        }, (err) => {
          this.doPosttoStream720(dataget, nextno)
        })
    });
  }
  doClsdServerTemp(dataget) {
    const headers = new HttpHeaders()
      .set("Content-Type", "application/json");
    this.api.put("table/z_channel_stream_temp",
      {
        "id": dataget.id,
        "status": 'CLSD'
      },
      { headers })
      .subscribe(val => {
      }, err => {
        this.doClsdServerTemp(dataget)
      });
  }
  getNextNo() {
    return this.api.get('nextno/z_channel_stream/id')
  }
  getNextNoUrl() {
    return this.api.get('nextno/z_channel_stream_url/id')
  }
  doGetUrlUseeTV() {
    this.api.get("table/z_get_url", { params: { limit: 1000, filter: "status = 'OPEN'" } })
      .subscribe(val => {
        let data = val['data']
        for (let i = 0; i < data.length; i++) {
          let dataurl = data[i]
          this.doGetUseeTV(dataurl)
        }
      });
  }
  doGetUseeTV(dataurl) {
    var self = this
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function () {
      if (xhr.readyState == XMLHttpRequest.DONE) {
        if (xhr.status == 200) {
          var str = xhr.responseText
          let startparam = str.search(dataurl.start_param)
          let endparam = str.search(dataurl.end_param)
          var urlvideo = str.substring(startparam, endparam)
          self.doUpdateURLUseeTV(dataurl, urlvideo)
        } else {
          self.doGetUseeTV(dataurl)
        }
      }
    }
    xhr.onerror = function () {

    };
    xhr.open('GET', dataurl.url, true);
    xhr.send(null);
  }
  doUpdateURLUseeTV(dataurl, urlvideo) {
    const headers = new HttpHeaders()
      .set("Content-Type", "application/json");
    this.api.put("table/z_get_url",
      {
        "id": dataurl.id,
        "url_result": urlvideo,
        "datetime": moment().format('YYYY-MM-DD HH:mm')
      },
      { headers })
      .subscribe(val => {
        this.doUpdateURLUseeTVChannel(dataurl, urlvideo)
      }, err => {
        this.doUpdateURLUseeTV(dataurl, urlvideo)
      });
  }
  doUpdateURLUseeTVChannel(dataurl, urlvideo) {
    this.api.get("table/z_channel_url", { params: { limit: 10, filter: "id_channel =" + "'" + dataurl.id_channel + "'" } })
      .subscribe(val => {
        let data = val['data']
        const headers = new HttpHeaders()
          .set("Content-Type", "application/json");
        this.api.put("table/z_channel_url",
          {
            "id": data[0].id,
            "url": urlvideo
          },
          { headers })
          .subscribe(val => {
            const headers = new HttpHeaders()
              .set("Content-Type", "application/json");
            this.api.put("table/z_channel",
              {
                "id": dataurl.id_channel,
                "url": urlvideo
              },
              { headers })
              .subscribe(val => {
              }, err => {
                this.doUpdateURLUseeTVChannel(dataurl, urlvideo)
              });
          }, err => {
            this.doUpdateURLUseeTVChannel(dataurl, urlvideo)
          });
      });
  }
  doGetLive() {
    this.api.get("table/z_channel_live_get", { params: { limit: 100, filter: "status= 'OPEN'" } })
      .subscribe(val => {
        let data = val['data']
        for (let i = 0; i < data.length; i++) {
          let name = data[i].name
          let url = data[i].url
          this.doGetURLLive(name, url)
        }
      });
  }
  doGetURLLive(name, url) {
    var self = this
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function () {
      if (xhr.readyState == XMLHttpRequest.DONE) {
        if (xhr.status == 200) {
          var str = xhr.responseText
          var count = str.split("http://m.nobartv.com/tv-bola/").length - 1
          let startparam: any;
          let endparam: any;
          console.log(count)
          for (let i = 1; i <= count; i++) {
            startparam = str.indexOf('http://m.nobartv.com/tv-bola/', startparam + 1)
            endparam = str.indexOf('rel="index,follow" target="_blank">', endparam + 1)
            var urlvideo = str.substring(startparam, endparam - 3)
            self.doGetURLLiveDetail(name, urlvideo)
          }
        } else {
          self.doGetURLLive(name, url)
        }
      }
    }
    xhr.onerror = function () {

    };
    xhr.open('GET', url, true);
    xhr.send(null);
  }
  doGetURLLiveDetail(name, urlvideo) {
    var self = this
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function () {
      if (xhr.readyState == XMLHttpRequest.DONE) {
        if (xhr.status == 200) {
          var str = xhr.responseText
          let startparam1 = str.indexOf('<span itemprop="title"><b>')
          let endparam1 = str.indexOf('</b></span>')
          let startparam2 = str.indexOf('<span itemprop="title"><b>', startparam1 + 1)
          let endparam2 = str.indexOf('</b></span>', endparam1 + 1)
          let startparam3 = str.indexOf('<span itemprop="title"><b>', startparam2 + 1)
          let endparam3 = str.indexOf('</b></span>', endparam2 + 1)

          let minggu = str.indexOf('<div class="dtime"><b>Minggu')
          let senin = str.indexOf('<div class="dtime"><b>Senin')
          let selasa = str.indexOf('<div class="dtime"><b>Selasa')
          let rabu = str.indexOf('<div class="dtime"><b>Rabu')
          let kamis = str.indexOf('<div class="dtime"><b>Kamis')
          let jumat = str.indexOf('<div class="dtime"><b>Jumat')
          let sabtu = str.indexOf('<div class="dtime"><b>Sabtu')

          let minggudate = str.indexOf('<div class="date">Minggu')
          let senindate = str.indexOf('<div class="date">Senin')
          let selasadate = str.indexOf('<div class="date">Selasa')
          let rabudate = str.indexOf('<div class="date">Rabu')
          let kamisdate = str.indexOf('<div class="date">Kamis')
          let jumatdate = str.indexOf('<div class="date">Jumat')
          let sabtudate = str.indexOf('<div class="date">Sabtu')

          let datestart = str.indexOf('<div class="dtime"><b>')
          let dateend = str.indexOf('</b></div>')
          let datestart2 = str.indexOf('<div class="date">')
          let timestart2 = str.indexOf('<div class="time"><b>')
          var date: any;
          var datefinish: any;
          var timefull: any;
          var timefix: any;
          var title: any;
          var datefix: any;

          if (minggu != -1) {
            date = str.substring(datestart + 30, dateend - 10).replace("Mei", "May")
            timefull = str.substring(datestart + 30, dateend - 4)

            timefix = timefull.substring(timefull.length - 5)
            title = str.substring(startparam3 + 26, endparam3)
            datefix = moment(date + ' 2019 ' + timefix).format('YYYY-MM-DD HH:mm')
            datefinish = moment(datefix, 'YYYY-MM-DD HH:mm')
              .add(2, 'hours')
              .format('YYYY-MM-DD HH:mm');
            let justdate = moment(datefix).format('YYYY-MM-DD')
            self.api.get("table/z_channel_live", { params: { limit: 100, filter: "title= " + "'" + title + "' AND date =" + "'" + justdate + "'" } })
              .subscribe(val => {
                let data = val['data']
                if (data.length == 0) {
                  self.doPostLive(name, title, urlvideo, datefix, datefinish)
                }
                else {
                  let id = data[0].id
                  self.doPutLive(id, name, title, urlvideo, datefix, datefinish)
                }
              });
          }
          else if (senin != -1) {
            date = str.substring(datestart + 29, dateend - 10).replace("Mei", "May")
            timefull = str.substring(datestart + 29, dateend - 4)

            timefix = timefull.substring(timefull.length - 5)
            title = str.substring(startparam3 + 26, endparam3)
            datefix = moment(date + ' 2019 ' + timefix).format('YYYY-MM-DD HH:mm')
            datefinish = moment(datefix, 'YYYY-MM-DD HH:mm')
              .add(2, 'hours')
              .format('YYYY-MM-DD HH:mm');
            let justdate = moment(datefix).format('YYYY-MM-DD')
            self.api.get("table/z_channel_live", { params: { limit: 100, filter: "title= " + "'" + title + "' AND date =" + "'" + justdate + "'" } })
              .subscribe(val => {
                let data = val['data']
                if (data.length == 0) {
                  self.doPostLive(name, title, urlvideo, datefix, datefinish)
                }
                else {
                  let id = data[0].id
                  self.doPutLive(id, name, title, urlvideo, datefix, datefinish)
                }
              });
          }
          else if (selasa != -1) {
            date = str.substring(datestart + 30, dateend - 10).replace("Mei", "May")
            timefull = str.substring(datestart + 30, dateend - 4)

            timefix = timefull.substring(timefull.length - 5)
            title = str.substring(startparam3 + 26, endparam3)
            datefix = moment(date + ' 2019 ' + timefix).format('YYYY-MM-DD HH:mm')
            datefinish = moment(datefix, 'YYYY-MM-DD HH:mm')
              .add(2, 'hours')
              .format('YYYY-MM-DD HH:mm');
            let justdate = moment(datefix).format('YYYY-MM-DD')
            self.api.get("table/z_channel_live", { params: { limit: 100, filter: "title= " + "'" + title + "' AND date =" + "'" + justdate + "'" } })
              .subscribe(val => {
                let data = val['data']
                if (data.length == 0) {
                  self.doPostLive(name, title, urlvideo, datefix, datefinish)
                }
                else {
                  let id = data[0].id
                  self.doPutLive(id, name, title, urlvideo, datefix, datefinish)
                }
              });
          }
          else if (rabu != -1) {
            date = str.substring(datestart + 28, dateend - 10).replace("Mei", "May")
            timefull = str.substring(datestart + 28, dateend - 4)

            timefix = timefull.substring(timefull.length - 5)
            title = str.substring(startparam3 + 26, endparam3)
            datefix = moment(date + ' 2019 ' + timefix).format('YYYY-MM-DD HH:mm')
            datefinish = moment(datefix, 'YYYY-MM-DD HH:mm')
              .add(2, 'hours')
              .format('YYYY-MM-DD HH:mm');
            let justdate = moment(datefix).format('YYYY-MM-DD')
            self.api.get("table/z_channel_live", { params: { limit: 100, filter: "title= " + "'" + title + "' AND date =" + "'" + justdate + "'" } })
              .subscribe(val => {
                let data = val['data']
                if (data.length == 0) {
                  self.doPostLive(name, title, urlvideo, datefix, datefinish)
                }
                else {
                  let id = data[0].id
                  self.doPutLive(id, name, title, urlvideo, datefix, datefinish)
                }
              });
          }
          else if (kamis != -1) {
            date = str.substring(datestart + 29, dateend - 10).replace("Mei", "May")
            timefull = str.substring(datestart + 29, dateend - 4)

            timefix = timefull.substring(timefull.length - 5)
            title = str.substring(startparam3 + 26, endparam3)
            datefix = moment(date + ' 2019 ' + timefix).format('YYYY-MM-DD HH:mm')
            datefinish = moment(datefix, 'YYYY-MM-DD HH:mm')
              .add(2, 'hours')
              .format('YYYY-MM-DD HH:mm');
            let justdate = moment(datefix).format('YYYY-MM-DD')
            self.api.get("table/z_channel_live", { params: { limit: 100, filter: "title= " + "'" + title + "' AND date =" + "'" + justdate + "'" } })
              .subscribe(val => {
                let data = val['data']
                if (data.length == 0) {
                  self.doPostLive(name, title, urlvideo, datefix, datefinish)
                }
                else {
                  let id = data[0].id
                  self.doPutLive(id, name, title, urlvideo, datefix, datefinish)
                }
              });
          }
          else if (jumat != -1) {
            date = str.substring(datestart + 29, dateend - 10).replace("Mei", "May")
            timefull = str.substring(datestart + 29, dateend - 4)

            timefix = timefull.substring(timefull.length - 5)
            title = str.substring(startparam3 + 26, endparam3)
            datefix = moment(date + ' 2019 ' + timefix).format('YYYY-MM-DD HH:mm')
            datefinish = moment(datefix, 'YYYY-MM-DD HH:mm')
              .add(2, 'hours')
              .format('YYYY-MM-DD HH:mm');
            let justdate = moment(datefix).format('YYYY-MM-DD')
            self.api.get("table/z_channel_live", { params: { limit: 100, filter: "title= " + "'" + title + "' AND date =" + "'" + justdate + "'" } })
              .subscribe(val => {
                let data = val['data']
                if (data.length == 0) {
                  self.doPostLive(name, title, urlvideo, datefix, datefinish)
                }
                else {
                  let id = data[0].id
                  self.doPutLive(id, name, title, urlvideo, datefix, datefinish)
                }
              });
          }
          else if (sabtu != -1) {
            date = str.substring(datestart + 29, dateend - 10).replace("Mei", "May")
            timefull = str.substring(datestart + 29, dateend - 4)

            timefix = timefull.substring(timefull.length - 5)
            title = str.substring(startparam3 + 26, endparam3)
            datefix = moment(date + ' 2019 ' + timefix).format('YYYY-MM-DD HH:mm')
            datefinish = moment(datefix, 'YYYY-MM-DD HH:mm')
              .add(2, 'hours')
              .format('YYYY-MM-DD HH:mm');
            let justdate = moment(datefix).format('YYYY-MM-DD')
            self.api.get("table/z_channel_live", { params: { limit: 100, filter: "title= " + "'" + title + "' AND date =" + "'" + justdate + "'" } })
              .subscribe(val => {
                let data = val['data']
                if (data.length == 0) {
                  self.doPostLive(name, title, urlvideo, datefix, datefinish)
                }
                else {
                  let id = data[0].id
                  self.doPutLive(id, name, title, urlvideo, datefix, datefinish)
                }
              });
          }
          else if (minggudate != -1) {
            date = str.substring(datestart2 + 26, timestart2 - 19).replace("Mei", "May")
            timefix = str.substring(timestart2 + 21, timestart2 + 26)
            title = str.substring(startparam3 + 26, endparam3)
            datefix = moment(date + ' 2019 ' + timefix).format('YYYY-MM-DD HH:mm')
            datefinish = moment(datefix, 'YYYY-MM-DD HH:mm')
              .add(2, 'hours')
              .format('YYYY-MM-DD HH:mm');
            let justdate = moment(datefix).format('YYYY-MM-DD')
            self.api.get("table/z_channel_live", { params: { limit: 100, filter: "title= " + "'" + title + "' AND date =" + "'" + justdate + "'" } })
              .subscribe(val => {
                let data = val['data']
                if (data.length == 0) {
                  self.doPostLive(name, title, urlvideo, datefix, datefinish)
                }
                else {
                  let id = data[0].id
                  self.doPutLive(id, name, title, urlvideo, datefix, datefinish)
                }
              });
          }
          else if (senindate != -1) {
            date = str.substring(datestart2 + 25, timestart2 - 19).replace("Mei", "May")
            timefix = str.substring(timestart2 + 21, timestart2 + 26)
            title = str.substring(startparam3 + 26, endparam3)
            datefix = moment(date + ' 2019 ' + timefix).format('YYYY-MM-DD HH:mm')
            datefinish = moment(datefix, 'YYYY-MM-DD HH:mm')
              .add(2, 'hours')
              .format('YYYY-MM-DD HH:mm');
            let justdate = moment(datefix).format('YYYY-MM-DD')
            self.api.get("table/z_channel_live", { params: { limit: 100, filter: "title= " + "'" + title + "' AND date =" + "'" + justdate + "'" } })
              .subscribe(val => {
                let data = val['data']
                if (data.length == 0) {
                  self.doPostLive(name, title, urlvideo, datefix, datefinish)
                }
                else {
                  let id = data[0].id
                  self.doPutLive(id, name, title, urlvideo, datefix, datefinish)
                }
              });
          }
          else if (selasadate != -1) {
            date = str.substring(datestart2 + 26, timestart2 - 19).replace("Mei", "May")
            timefix = str.substring(timestart2 + 21, timestart2 + 26)
            title = str.substring(startparam3 + 26, endparam3)
            datefix = moment(date + ' 2019 ' + timefix).format('YYYY-MM-DD HH:mm')
            datefinish = moment(datefix, 'YYYY-MM-DD HH:mm')
              .add(2, 'hours')
              .format('YYYY-MM-DD HH:mm');
            let justdate = moment(datefix).format('YYYY-MM-DD')
            self.api.get("table/z_channel_live", { params: { limit: 100, filter: "title= " + "'" + title + "' AND date =" + "'" + justdate + "'" } })
              .subscribe(val => {
                let data = val['data']
                if (data.length == 0) {
                  self.doPostLive(name, title, urlvideo, datefix, datefinish)
                }
                else {
                  let id = data[0].id
                  self.doPutLive(id, name, title, urlvideo, datefix, datefinish)
                }
              });
          }
          else if (rabudate != -1) {
            date = str.substring(datestart2 + 24, timestart2 - 19).replace("Mei", "May")
            timefix = str.substring(timestart2 + 21, timestart2 + 26)
            title = str.substring(startparam3 + 26, endparam3)
            datefix = moment(date + ' 2019 ' + timefix).format('YYYY-MM-DD HH:mm')
            datefinish = moment(datefix, 'YYYY-MM-DD HH:mm')
              .add(2, 'hours')
              .format('YYYY-MM-DD HH:mm');
            let justdate = moment(datefix).format('YYYY-MM-DD')
            self.api.get("table/z_channel_live", { params: { limit: 100, filter: "title= " + "'" + title + "' AND date =" + "'" + justdate + "'" } })
              .subscribe(val => {
                let data = val['data']
                if (data.length == 0) {
                  self.doPostLive(name, title, urlvideo, datefix, datefinish)
                }
                else {
                  let id = data[0].id
                  self.doPutLive(id, name, title, urlvideo, datefix, datefinish)
                }
              });
          }
          else if (kamisdate != -1) {
            date = str.substring(datestart2 + 25, timestart2 - 19).replace("Mei", "May")
            timefix = str.substring(timestart2 + 21, timestart2 + 26)
            title = str.substring(startparam3 + 26, endparam3)
            datefix = moment(date + ' 2019 ' + timefix).format('YYYY-MM-DD HH:mm')
            datefinish = moment(datefix, 'YYYY-MM-DD HH:mm')
              .add(2, 'hours')
              .format('YYYY-MM-DD HH:mm');
            let justdate = moment(datefix).format('YYYY-MM-DD')
            self.api.get("table/z_channel_live", { params: { limit: 100, filter: "title= " + "'" + title + "' AND date =" + "'" + justdate + "'" } })
              .subscribe(val => {
                let data = val['data']
                if (data.length == 0) {
                  self.doPostLive(name, title, urlvideo, datefix, datefinish)
                }
                else {
                  let id = data[0].id
                  self.doPutLive(id, name, title, urlvideo, datefix, datefinish)
                }
              });
          }
          else if (jumatdate != -1) {
            date = str.substring(datestart2 + 25, timestart2 - 19).replace("Mei", "May")
            timefix = str.substring(timestart2 + 21, timestart2 + 26)
            title = str.substring(startparam3 + 26, endparam3)
            datefix = moment(date + ' 2019 ' + timefix).format('YYYY-MM-DD HH:mm')
            datefinish = moment(datefix, 'YYYY-MM-DD HH:mm')
              .add(2, 'hours')
              .format('YYYY-MM-DD HH:mm');
            let justdate = moment(datefix).format('YYYY-MM-DD')
            self.api.get("table/z_channel_live", { params: { limit: 100, filter: "title= " + "'" + title + "' AND date =" + "'" + justdate + "'" } })
              .subscribe(val => {
                let data = val['data']
                if (data.length == 0) {
                  self.doPostLive(name, title, urlvideo, datefix, datefinish)
                }
                else {
                  let id = data[0].id
                  self.doPutLive(id, name, title, urlvideo, datefix, datefinish)
                }
              });
          }
          else if (sabtudate != -1) {
            date = str.substring(datestart2 + 25, timestart2 - 19).replace("Mei", "May")
            timefix = str.substring(timestart2 + 21, timestart2 + 26)
            title = str.substring(startparam3 + 26, endparam3)
            datefix = moment(date + ' 2019 ' + timefix).format('YYYY-MM-DD HH:mm')
            datefinish = moment(datefix, 'YYYY-MM-DD HH:mm')
              .add(2, 'hours')
              .format('YYYY-MM-DD HH:mm');
            let justdate = moment(datefix).format('YYYY-MM-DD')
            self.api.get("table/z_channel_live", { params: { limit: 100, filter: "title= " + "'" + title + "' AND date =" + "'" + justdate + "'" } })
              .subscribe(val => {
                let data = val['data']
                if (data.length == 0) {
                  self.doPostLive(name, title, urlvideo, datefix, datefinish)
                }
                else {
                  let id = data[0].id
                  self.doPutLive(id, name, title, urlvideo, datefix, datefinish)
                }
              });
          }

        } else {
          self.doGetURLLiveDetail(name, urlvideo)
        }
      }
    }
    xhr.onerror = function () {

    };
    xhr.open('GET', urlvideo, true);
    xhr.send(null);
  }
  getNextNoLive() {
    return this.api.get('nextno/z_channel_live/id')
  }
  getNextNoLiveUrl() {
    return this.api.get('nextno/z_channel_live_url/id')
  }
  getNextNoLiveTemp() {
    return this.api.get('nextno/z_channel_live_temp/id')
  }
  doPostLive(name, title, urlvideo, datefix, datefinish) {
    this.getNextNoLive().subscribe(val => {
      let nextno = val['nextno'];
      const headers = new HttpHeaders()
        .set("Content-Type", "application/json");
      this.api.post("table/z_channel_live",
        {
          "id": nextno,
          "stream": '',
          "type": 'LIVE',
          "plugin": '',
          "category": name,
          "title": title,
          "url": '',
          "date": moment(datefix).format('YYYY-MM-DD'),
          "datestart": datefix,
          "datefinish": datefinish,
          "status": 'OPEN',
          "status_2": 'OPEN'
        },
        { headers })
        .subscribe(val => {
          this.doPostLiveURL(nextno, name, title, urlvideo, datefix, datefinish)
        }, (err) => {
          //this.doPostLive(name, title, urlvideo, datefix, datefinish)
        })
    });
  }
  doPostLiveURL(nextno, name, title, urlvideo, datefix, datefinish) {
    this.getNextNoLiveUrl().subscribe(val => {
      let nextnoa = val['nextno'];
      const headers = new HttpHeaders()
        .set("Content-Type", "application/json");
      this.api.post("table/z_channel_live_url",
        {
          "id": nextnoa,
          "id_channel": nextno,
          "stream": '',
          "type": 'LIVE',
          "plugin": '',
          "category": name,
          "title": title,
          "quality": 'Server 1',
          "url": '',
          "date": moment(datefix).format('YYYY-MM-DD'),
          "datestart": datefix,
          "datefinish": datefinish,
          "status": 'OPEN',
          "status_2": 'OPEN'
        },
        { headers })
        .subscribe(val => {
          this.doPostLiveTemp(nextno, name, title, urlvideo, datefix, datefinish)
        }, (err) => {
          this.doPostLiveURL(nextno, name, title, urlvideo, datefix, datefinish)
        })
    });
  }
  doPostLiveTemp(nextno, name, title, urlvideo, datefix, datefinish) {
    this.getNextNoLiveTemp().subscribe(val => {
      let nextnolivetemp = val['nextno'];
      const headers = new HttpHeaders()
        .set("Content-Type", "application/json");
      this.api.post("table/z_channel_live_temp",
        {
          "id": nextnolivetemp,
          "id_channel": nextno,
          "name": title,
          "url": urlvideo,
          "datetime_start": datefix,
          "datetime_end": datefinish,
          "status_update": 0,
          "status": 'OPEN',
          "status_2": 'OPEN'
        },
        { headers })
        .subscribe(val => {
        }, (err) => {
          this.doPostLiveTemp(nextno, name, title, urlvideo, datefix, datefinish)
        })
    });
  }
  doPutLive(id, name, title, urlvideo, datefix, datefinish) {
    const headers = new HttpHeaders()
      .set("Content-Type", "application/json");
    this.api.put("table/z_channel_live",
      {
        "id": id,
        "stream": '',
        "type": 'LIVE',
        "plugin": '',
        "category": name,
        "title": title,
        "url": '',
        "date": moment(datefix).format('YYYY-MM-DD'),
        "datestart": datefix,
        "datefinish": datefinish,
        "status": 'OPEN',
        "status_2": 'OPEN'
      },
      { headers })
      .subscribe(val => {
        this.doPutLiveURL(id, name, title, urlvideo, datefix, datefinish)
      }, (err) => {
        //this.doPutLive(id, name, title, urlvideo, datefix, datefinish)
      })
  }
  doPutLiveURL(id, name, title, urlvideo, datefix, datefinish) {
    this.api.get("table/z_channel_live_url", { params: { limit: 100, filter: "id_channel= " + "'" + id + "'" } })
      .subscribe(val => {
        let data = val['data']
        if (data.length == 0) {
          let nextno = id
          this.doPostLiveURL(nextno, name, title, urlvideo, datefix, datefinish)
        }
        else {
          const headers = new HttpHeaders()
            .set("Content-Type", "application/json");
          this.api.put("table/z_channel_live_url",
            {
              "id": data[0].id,
              "id_channel": id,
              "stream": '',
              "type": 'LIVE',
              "plugin": '',
              "category": name,
              "title": title,
              "quality": 'Server 1',
              "url": '',
              "date": moment(datefix).format('YYYY-MM-DD'),
              "datestart": datefix,
              "datefinish": datefinish,
              "status": 'OPEN',
              "status_2": 'OPEN'
            },
            { headers })
            .subscribe(val => {
              this.doPutLiveTemp(id, name, title, urlvideo, datefix, datefinish)
            }, (err) => {
              this.doPutLiveURL(id, name, title, urlvideo, datefix, datefinish)
            })
        }
      });
  }
  doPutLiveTemp(id, name, title, urlvideo, datefix, datefinish) {
    this.api.get("table/z_channel_live_temp", { params: { limit: 100, filter: "id_channel= " + "'" + id + "'" } })
      .subscribe(val => {
        let data = val['data']
        if (data.length == 0) {
          let nextno = id
          this.doPostLiveTemp(nextno, name, title, urlvideo, datefix, datefinish)
        }
        else {
          const headers = new HttpHeaders()
            .set("Content-Type", "application/json");
          this.api.put("table/z_channel_live_temp",
            {
              "id": data[0].id,
              "id_channel": id,
              "name": title,
              "url": urlvideo,
              "datetime_start": datefix,
              "datetime_end": datefinish,
              "status_update": 0,
              "status": 'OPEN',
              "status_2": 'OPEN'
            },
            { headers })
            .subscribe(val => {
            }, (err) => {
              this.doPutLiveTemp(id, name, title, urlvideo, datefix, datefinish)
            })
        }
      });
  }
  doGetJsonAnime() {
    this.api.get("table/z_scan_loop", { params: { limit: 10, filter: "name='ANIME'" } })
      .subscribe(val => {
        let data = val['data']
        for (let i = data[0].start_scan; i <= data[0].finish_scan; i++) {
          this.doGetListLinkAnime(i)
        }
      });
  }
  doGetJsonAnimeUpdate() {
    this.api.get("table/z_channel_stream_detail_temp", { params: { limit: 10000, filter: "status='OPEN' AND (url_ori = '' OR url_ori IS NULL)" } })
      .subscribe(val => {
        let data = val['data']
        for (let j = 0; j < data.length; j++) {
          let i = data[j].id
          this.doGetListLinkAnime(i)
        }
      });
  }
  doGetListLinkAnime(i) {
    var dataurlapi = 'https://anoboy.org/?p=' + i
    var self = this
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function () {
      if (xhr.readyState == XMLHttpRequest.DONE) {
        if (xhr.status == 200) {
          var str = xhr.responseText
          var titleweb = str.search('Page not found - anoBoy.org');
          if (titleweb == -1) {
            var starttitle = str.search('<title>')
            var endtitle = str.search('</title>')
            var starturlori = str.search('<link rel="canonical" href="')
            var endurlori = str.search('<link rel="publisher" href="')
            var starteps = str.search('Episode')
            var endeps = str.search('Subtitle Indonesia')
            var startthumbnail = str.indexOf('<amp-img src="')
            var startthumbnailfix = str.indexOf('<amp-img src="', startthumbnail + 1)
            var endthumbnailfix = str.indexOf('" class="maingambar"')
            var starturlold = str.search('<source src="/mov')
            var endurlold = str.search('" type="video/mp4">')
            var starturl = str.search('<source src="')
            var endurl = str.search('" type="video/mp4">')
            var starturlembed = str.search('<iframe title="noboy" id="mediaplayer" src="')
            var endurlembed = str.search('" allowfullscreen="true"')
            var starturlembedold = str.search("id='mediaplayer'")
            var endurlembedold = str.search("' allowfullscreen")
            var url: any;
            var stream: any;
            var title = str.substring(starttitle + 7, endtitle - 32)
            var urlori = str.substring(starturlori + 28, endurlori - 5)
            //var eps = str.substring(starteps + 8, endeps - 1)
            var thumbnail = str.substring(startthumbnailfix + 14, endthumbnailfix)
            if (starturlold != -1) {
              url = 'http://anoboy.org' + str.substring(starturl + 13, endurl)
              stream = '0'
            }
            else if (starturl != -1) {
              url = str.substring(starturl + 13, endurl)
              stream = '0'
            }
            else if (starturlembed != -1) {
              url = str.substring(starturlembed + 44, endurlembed)
              stream = ''
            }
            else if (starturlembedold != -1) {
              url = 'http://anoboy.org' + str.substring(starturlembedold + 22, endurlembedold)
              stream = ''
            }
            if (starturl != -1 || starturlembed != -1 || starturlembedold != -1) {
              var titlefix: any;
              var eps: any;
              if (title.search('Episode') != -1) {
                titlefix = title.substring(0, title.search('Episode') - 1)
                eps = title.substring(title.search('Episode') + 8, title.length)
              }
              else {
                titlefix = title
                eps = ''
              }
              self.api.get("table/z_channel_stream_detail_temp", { params: { limit: 10, filter: "id=" + "'" + i + "'" } })
                .subscribe(val => {
                  let data = val['data']
                  if (data.length == 0) {
                    self.doPostListLinkAnime(i, title, titlefix, urlori, eps, stream, thumbnail, url)
                  }
                  else {
                    self.doPutListLinkAnime(i, title, titlefix, urlori, eps, stream, thumbnail, url)
                  }
                });
            }
          }
        }
        else if (xhr.status == 404) {

        }
        else {
          self.doGetListLinkAnime(i)
        }
      }
    }
    xhr.onerror = function () {

    };
    xhr.open('GET', dataurlapi, true);
    xhr.send(null);
  }
  doPostListLinkAnime(i, title, titlefix, urlori, eps, stream, thumbnail, url) {
    const headers = new HttpHeaders()
      .set("Content-Type", "application/json");
    this.api.post("table/z_channel_stream_detail_temp",
      {
        "id": i,
        "url_ori": urlori,
        "title_ori": title,
        "title": titlefix,
        "episode": eps,
        "thumbnail": thumbnail,
        "stream": stream,
        "url": url,
        "status": 'OPEN',
        "datetime": moment().format('YYYY-MM-DD HH:mm')
      },
      { headers })
      .subscribe(val => {
      }, err => {
        this.doPostListLinkAnime(i, title, titlefix, urlori, eps, stream, thumbnail, url)
      });
  }
  doPutListLinkAnime(i, title, titlefix, urlori, eps, stream, thumbnail, url) {
    const headers = new HttpHeaders()
      .set("Content-Type", "application/json");
    this.api.put("table/z_channel_stream_detail_temp",
      {
        "id": i,
        "url_ori": urlori,
        "title_ori": title,
        "title": titlefix,
        "episode": eps,
        "thumbnail": thumbnail,
        "stream": stream,
        "url": url,
        "status": 'OPEN',
        "datetime": moment().format('YYYY-MM-DD HH:mm')
      },
      { headers })
      .subscribe(val => {
      }, err => {
        this.doPutListLinkAnime(i, title, titlefix, urlori, eps, stream, thumbnail, url)
      });
  }
  doGetListAnime() {
    var self = this
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function () {
      if (xhr.readyState == XMLHttpRequest.DONE) {
        if (xhr.status == 200) {
          var str = xhr.responseText
          var count = str.split("https://anoboy.org/20").length - 1
          let startparam: any;
          let endparam: any;
          let starttitle: any;
          let endtitle: any;
          console.log(count)
          for (let i = 1; i <= count; i++) {
            startparam = str.indexOf('https://anoboy.org/20', startparam + 1)
            endparam = str.indexOf('" rel="bookmark"', endparam + 1)
            starttitle = str.indexOf('rel="bookmark" title="', startparam + 1)
            endtitle = str.indexOf('</a></p>', endparam + 1)
            var url = str.substring(startparam, endparam)
            var title = str.substring(starttitle + 22, endtitle)
            title = title.substring(0, title.indexOf('"'));
            self.doPostListAnime(url, title)
          }
        }
        else if (xhr.status == 404) {

        }
        else if (xhr.status == 301) {

        }
        else {
          self.doGetListAnime()
        }
      }
    }
    xhr.onerror = function () {

    };
    xhr.open('GET', 'https://anoboy.org/anime-list-sub-indo/', true);
    xhr.send(null);
  }
  doPostListAnime(url, title) {
    this.api.get("table/z_channel_stream_detail_list", { params: { limit: 1000, filter: "title=" + "'" + title + "'" } })
      .subscribe(val => {
        let data = val['data']
        if (data.length == 0) {
          const headers = new HttpHeaders()
            .set("Content-Type", "application/json");
          this.api.post("table/z_channel_stream_detail_list",
            {
              "title": title,
              "url": url,
              "status": 'OPEN',
              "datetime": moment().format('YYYY-MM-DD HH:mm')
            },
            { headers })
            .subscribe(val => {
            }, err => {
              this.doPostListAnime(url, title)
            });
        }
      });
  }
  doGetListAnimeData() {
    this.api.get("table/z_channel_stream_detail_list", { params: { limit: 1000, filter: "status='OPEN'" } })
      .subscribe(val => {
        let data = val['data']
        for (let i = 0; i < data.length; i++) {
          let datalist = data[i]
          this.doGetListAnimeDataList(datalist)
        }
      });
  }
  doGetListAnimeDataList(datalist) {
    var self = this
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function () {
      if (xhr.readyState == XMLHttpRequest.DONE) {
        if (xhr.status == 200) {
          var str = xhr.responseText
          var count = str.split('<li><a href="').length - 1
          var count2 = str.split('</li><').length - 1
          let startparam: any;
          let endparam: any;
          let starttitle: any;
          let endtitle: any;
          var title: any;
          var url: any;
          for (let i = 1; i <= count; i++) {
            startparam = str.indexOf('<li><a href="', startparam + 1)
            endparam = str.indexOf('" title="', endparam + 1)
            starttitle = str.indexOf('" title="', startparam + 1)
            endtitle = str.indexOf('</li><', endparam + 1)
            var endtitle2 = str.indexOf(']</a></li>', endparam + 1)
            if (i <= count2) {
              title = str.substring(starttitle + 9, endtitle - 5)
              url = str.substring(startparam + 13, endparam)
            }
            else {
              title = str.substring(starttitle + 9, endtitle2)
              url = 'https://anoboy.org' + str.substring(startparam + 13, endparam)
            }
            title = title.substring(0, title.indexOf('"'));
            var titledetail = datalist.title
            self.doPostListAnimeDetail(titledetail, url, title)
          }
        }
        else if (xhr.status == 404) {

        }
        else if (xhr.status == 301) {

        }
        else {
          self.doGetListAnimeDataList(datalist)
        }
      }
    }
    xhr.onerror = function () {

    };
    xhr.open('GET', datalist.url, true);
    xhr.send(null);
  }
  doPostListAnimeDetail(titledetail, url, title) {
    this.api.get("table/z_channel_stream_detail_list_detail", { params: { limit: 1000, filter: "title=" + "'" + title + "'" } })
      .subscribe(val => {
        let data = val['data']
        if (data.length == 0) {
          const headers = new HttpHeaders()
            .set("Content-Type", "application/json");
          this.api.post("table/z_channel_stream_detail_list_detail",
            {
              "title": title,
              "title_detail": titledetail,
              "url": url,
              "status": 'OPEN',
              "datetime": moment().format('YYYY-MM-DD HH:mm')
            },
            { headers })
            .subscribe(val => {
            }, err => {
              this.doPostListAnimeDetail(titledetail, url, title)
            });
        }
      });
  }
  doGetListAnimeDataUrl() {
    this.api.get("table/z_channel_stream_detail_list_detail", { params: { limit: 5000, filter: "status='OPEN'", sort: 'id ASC' } })
      .subscribe(val => {
        let data = val['data']
        for (let i = 0; i < data.length; i++) {
          let datalist = data[i]
          this.doGetListAnimeDataListUrl(datalist)
        }
      });
  }
  doGetListAnimeDataListUrl(datalist) {
    var self = this
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function () {
      if (xhr.readyState == XMLHttpRequest.DONE) {
        if (xhr.status == 200) {
          var str = xhr.responseText
          var count = str.split('data-video="/uploads').length - 1
          var epis = str.split('fas fa-play').length - 1
          var id = datalist.id
          let startparam: any;
          let endparam: any;
          let starttitle: any;
          let endtitle: any;
          var title: any;
          var url: any;
          if (count != 0) {
            for (let i = 1; i <= count; i++) {
              if (epis == 0) {
                startparam = str.indexOf('data-video="/uploads', startparam + 1)
                endparam = str.indexOf('" ', startparam + 1)
                starttitle = str.indexOf('>', startparam + 1)
                endtitle = str.indexOf('</a>', startparam + 1)
                url = 'https://anoboy.org' + str.substring(startparam + 12, endparam)
                title = str.substring(starttitle + 1, endtitle)
                let titleind = datalist.title
                let titleinddet = datalist.title_detail
                self.doPostListAnimeDetailURL(titleind, titleinddet, title, url)
              }
              else {
                startparam = str.indexOf('data-video="/uploads', startparam + 1)
                endparam = str.indexOf('">', startparam + 1)
                starttitle = str.indexOf('</i>', startparam + 1)
                endtitle = str.indexOf('</a>', startparam + 1)
                url = 'https://anoboy.org' + str.substring(startparam + 12, endparam)
                title = str.substring(starttitle + 4, endtitle)
                let titleind = datalist.title
                let titleinddet = datalist.title_detail
                self.doPostListAnimeDetailURL(titleind, titleinddet, title, url)
              }
            }
          }
        }
        else if (xhr.status == 404) {

        }
        else if (xhr.status == 301) {

        }
        else {
          self.doGetListAnimeDataListUrl(datalist)
        }
      }
    }
    xhr.onerror = function () {

    };
    xhr.open('GET', datalist.url, true);
    xhr.send(null);
  }
  doPostListAnimeDetailURL(titleind, titleinddet, title, url) {
    this.api.get("table/z_channel_stream_detail_list_detail_url", { params: { limit: 1000, filter: "title_ind_detail=" + "'" + titleinddet + "'" } })
      .subscribe(val => {
        let data = val['data']
        if (data.length == 0) {
          const headers = new HttpHeaders()
            .set("Content-Type", "application/json");
          this.api.post("table/z_channel_stream_detail_list_detail_url",
            {
              "title_ind": titleinddet,
              "title_ind_detail": titleind,
              "title": title,
              "url": url,
              "status": 'OPEN',
              "datetime": moment().format('YYYY-MM-DD HH:mm')
            },
            { headers })
            .subscribe(val => {
            }, err => {
              this.doPostListAnimeDetailURL(titleind, titleinddet, title, url)
            });
        }
      });
  }
  doCLSDListAnimeDetail(id) {
    const headers = new HttpHeaders()
      .set("Content-Type", "application/json");
    this.api.put("table/z_channel_stream_detail_list_detail",
      {
        "id": id,
        "status": 'CLSD'
      },
      { headers })
      .subscribe(val => {
      }, err => {
        this.doCLSDListAnimeDetail(id)
      });
  }
  doGetCalendar() {
    this.api.get("table/z_calendar_get", { params: { limit: 1000 } })
      .subscribe(val => {
        let data = val['data']
        var startDate = moment(data[0].datestart, 'YYYY-MM-DD');
        var endDate = moment(data[0].datefinish, 'YYYY-MM-DD');
        var diff = endDate.diff(startDate, 'days')
        let datestart = moment(data[0].datestart).format('YYYY-MM-DD')
        let datenext: any;
        for (let i = 0; i < diff; i++) {
          datenext = moment(datestart, 'YYYY-MM-DD')
            .add(i, 'day')
            .format('ddd YYYY-MM-DD');
          let date = new Date(moment(datenext).format('YYYY-MM-DD'));
          date.setHours(0, 0, 0, 0);
          // Thursday in current week decides the year.
          date.setDate(date.getDate() + 3 - (date.getDay() + 7) % 7);
          // January 4 is always in week 1.
          let week1 = new Date(date.getFullYear(), 0, 4);
          // Adjust to Thursday in week 1 and count number of weeks from date to week1.
          let batch = (Math.round(((date.getTime() - week1.getTime()) / 86400000
            - 3 + (week1.getDay() + 7) % 7) / 7) + 1)
          //let batchno = (date.getFullYear().toString().substr(-2)) //Get Year 2 Digit
          this.doPostCalendar(datenext, batch)
        }
      }, err => {
        this.doGetCalendar()
      });
  }
  doPostCalendar(datenext, batch) {
    this.api.get("table/z_calendar", { params: { limit: 1000, filter: 'fulldate=' + "'" + moment(datenext).format('YYYY-MM-DD') + "'" } })
      .subscribe(val => {
        let data = val['data']
        if (data.length == 0) {
          const headers = new HttpHeaders()
            .set("Content-Type", "application/json");
          this.api.post("table/z_calendar",
            {
              "fulldate": moment(datenext).format('YYYY-MM-DD'),
              "day": moment(datenext).format('ddd'),
              "date": moment(datenext).format('DD'),
              "month": moment(datenext).format('MM'),
              "year": moment(datenext).format('YYYY'),
              "week": batch
            },
            { headers })
            .subscribe(val => {
            }, err => {
              this.doPostCalendar(datenext, batch)
            });
        }
      });
  }
  doGetJsonProv() {
    var self = this
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function () {
      if (xhr.readyState == XMLHttpRequest.DONE) {
        if (xhr.status == 200) {
          var datajson = JSON.parse(xhr.responseText)
          let data = datajson.aaData
          for (let i = 0; i < data.length; i++) {
            let prov = data[i]
            self.doGetProv(prov)
          }
        }
        else if (xhr.status == 404) {

        }
        else if (xhr.status == 301) {

        }
        else {
          self.doGetJsonProv()
        }
      }
    }
    xhr.onerror = function () {

    };
    xhr.open('GET', 'http://infopemilu.kpu.go.id/pilkada2018/pemilih/dpt/1/listNasional.json', true);
    xhr.send(null);
  }
  doGetProv(prov) {
    this.api.get("table/z_prov", { params: { limit: 1000, filter: 'prov=' + "'" + prov.namaWilayah + "'" } })
      .subscribe(val => {
        let data = val['data']
        if (data.length == 0) {
          this.doPostProv(prov)
        }
      }, err => {
        this.doGetProv(prov)
      });
  }
  doPostProv(prov) {
    const headers = new HttpHeaders()
      .set("Content-Type", "application/json");
    this.api.post("table/z_prov",
      {
        "prov": prov.namaWilayah,
        "total_pemilih": prov.totalPemilih,
        "pemilih_laki": prov.jmlPemilihLaki,
        "pemilih_perempuan": prov.jmlPemilihPerempuan,
        "status": 'OPEN'
      },
      { headers })
      .subscribe(val => {
      }, err => {
        this.doPostProv(prov)
      });
  }
  doDetail() {
    this.navCtrl.push('DetailPage')
  }
  doGetProvAll() {
    this.api.get("table/z_prov", { params: { limit: 1000, filter: "status='OPEN'" } })
      .subscribe(val => {
        let provinsi = val['data']
        for (let i = 0; i < provinsi.length; i++) {
          let prov = provinsi[i]
          this.doGetJsonKab(prov)
        }

      }, err => {
        this.doGetProvAll()
      });
  }
  doGetJsonKab(prov) {
    var self = this
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function () {
      if (xhr.readyState == XMLHttpRequest.DONE) {
        if (xhr.status == 200) {
          var datajson = JSON.parse(xhr.responseText)
          let data = datajson.aaData
          for (let i = 0; i < data.length; i++) {
            let kab = data[i]
            self.doGetKab(kab)
          }
        }
        else if (xhr.status == 404) {

        }
        else if (xhr.status == 301) {

        }
        else {
          self.doGetJsonKab(prov)
        }
      }
    }
    xhr.onerror = function () {

    };
    xhr.open('GET', 'https://infopemilu.kpu.go.id/pilkada2018/pemilih/dpt/1/' + prov.prov + '/listDps.json', true);
    xhr.send(null);
  }
  doGetKab(kab) {
    this.api.get("table/z_kab", { params: { limit: 1000, filter: 'prov=' + "'" + kab.namaPropinsi + "' AND kab=" + "'" + kab.namaKabKota + "'" } })
      .subscribe(val => {
        let data = val['data']
        if (data.length == 0) {
          this.doPostKab(kab)
        }
      }, err => {
        this.doGetKab(kab)
      });
  }
  getNextNoUrlKab() {
    return this.api.get('nextno/z_kab/id')
  }
  doPostKab(kab) {
    this.getNextNoUrlKab().subscribe(val => {
      let nextnourl = val['nextno'];
      const headers = new HttpHeaders()
        .set("Content-Type", "application/json");
      this.api.post("table/z_kab",
        {
          "id": nextnourl,
          "prov": kab.namaPropinsi,
          "kab": kab.namaKabKota,
          "total_pemilih": kab.totalPemilih,
          "pemilih_laki": kab.jmlPemilihLaki,
          "pemilih_perempuan": kab.jmlPemilihPerempuan,
          "status": 'OPEN'
        },
        { headers })
        .subscribe(val => {
        }, err => {
          this.doPostKab(kab)
        });
    });
  }
  doGetLoopKab() {
    this.api.get("table/z_scan_loop", { params: { limit: 1000, filter: "name='KAB'" } })
      .subscribe(val => {
        let data = val['data'][0]
        this.doGetKabAll(data)
      });
  }
  doGetKabAll(data) {
    this.api.get("table/z_kab", { params: { limit: 1000, filter: "id >=" + "'" + data.start_scan + "' AND id <=" + "'" + data.finish_scan + "' AND status='OPEN'" } })
      .subscribe(val => {
        let kabupaten = val['data']
        for (let i = 0; i < kabupaten.length; i++) {
          let kab = kabupaten[i]
          this.doGetJsonKec(kab)
        }

      }, err => {
        this.doGetKabAll(data)
      });
  }
  doGetJsonKec(kab) {
    var self = this
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function () {
      if (xhr.readyState == XMLHttpRequest.DONE) {
        if (xhr.status == 200) {
          var datajson = JSON.parse(xhr.responseText)
          let data = datajson.aaData
          for (let i = 0; i < data.length; i++) {
            let kec = data[i]
            self.doGetKec(kec)
          }
        }
        else if (xhr.status == 404) {

        }
        else if (xhr.status == 301) {

        }
        else if (xhr.status == 500) {

        }
        else {
          self.doGetJsonKec(kab)
        }
      }
    }
    xhr.onerror = function () {

    };
    xhr.open('GET', 'https://infopemilu.kpu.go.id/pilkada2018/pemilih/dpt/1/' + kab.prov + '/' + kab.kab + '/listDps.json', true);
    xhr.send(null);
  }
  doGetKec(kec) {
    this.api.get("table/z_kec", { params: { limit: 1000, filter: 'prov=' + "'" + kec.namaPropinsi + "' AND kab=" + "'" + kec.namaKabKota + "' AND kec=" + "'" + kec.namaKecamatan + "'" } })
      .subscribe(val => {
        let data = val['data']
        if (data.length == 0) {
          this.doPostKec(kec)
        }
      }, err => {
        this.doGetKec(kec)
      });
  }
  getNextNoUrlKec() {
    return this.api.get('nextno/z_kec/id')
  }
  doPostKec(kec) {
    this.getNextNoUrlKec().subscribe(val => {
      let nextnourl = val['nextno'];
      const headers = new HttpHeaders()
        .set("Content-Type", "application/json");
      this.api.post("table/z_kec",
        {
          "id": nextnourl,
          "prov": kec.namaPropinsi,
          "kab": kec.namaKabKota,
          "kec": kec.namaKecamatan,
          "total_pemilih": kec.totalPemilih,
          "pemilih_laki": kec.jmlPemilihLaki,
          "pemilih_perempuan": kec.jmlPemilihPerempuan,
          "status": 'OPEN'
        },
        { headers })
        .subscribe(val => {
        }, err => {
          this.doPostKec(kec)
        });
    });
  }
  doGetLoopKec() {
    this.api.get("table/z_scan_loop", { params: { limit: 1000, filter: "name='KEC'" } })
      .subscribe(val => {
        let data = val['data'][0]
        this.doGetKecAll(data)
      });
  }
  doGetKecAll(data) {
    this.api.get("table/z_kec", { params: { limit: 1000, filter: "id >=" + "'" + data.start_scan + "' AND id <=" + "'" + data.finish_scan + "' AND status='OPEN'" } })
      .subscribe(val => {
        let kecamatan = val['data']
        for (let i = 0; i < kecamatan.length; i++) {
          let kec = kecamatan[i]
          this.doGetJsonKel(kec)
        }

      }, err => {
        this.doGetKecAll(data)
      });
  }
  doGetJsonKel(kec) {
    var self = this
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function () {
      if (xhr.readyState == XMLHttpRequest.DONE) {
        if (xhr.status == 200) {
          var datajson = JSON.parse(xhr.responseText)
          let data = datajson.aaData
          for (let i = 0; i < data.length; i++) {
            let kel = data[i]
            self.doPostKel(kel)
          }
        }
        else if (xhr.status == 404) {

        }
        else if (xhr.status == 301) {

        }
        else if (xhr.status == 500) {

        }
        else {
          self.doGetJsonKel(kec)
        }
      }
    }
    xhr.onerror = function () {

    };
    xhr.open('GET', 'https://infopemilu.kpu.go.id/pilkada2018/pemilih/dpt/1/' + kec.prov + '/' + kec.kab + '/' + kec.kec + '/listDps.json', true);
    xhr.send(null);
  }
  doGetKel(kel) {
    this.api.get("table/z_kel", { params: { limit: 1000, filter: 'prov=' + "'" + kel.namaPropinsi + "' AND kab=" + "'" + kel.namaKabKota + "' AND kec=" + "'" + kel.namaKecamatan + "' AND kel=" + "'" + kel.namaKelurahan + "'" } })
      .subscribe(val => {
        let data = val['data']
        if (data.length == 0) {
          this.doPostKel(kel)
        }
      }, err => {
        this.doGetKel(kel)
      });
  }
  doPostKel(kel) {
    const headers = new HttpHeaders()
      .set("Content-Type", "application/json");
    this.api.post("table/z_kel",
      {
        "prov": kel.namaPropinsi,
        "kab": kel.namaKabKota,
        "kec": kel.namaKecamatan,
        "kel": kel.namaKelurahan,
        "total_pemilih": kel.totalPemilih,
        "pemilih_laki": kel.jmlPemilihLaki,
        "pemilih_perempuan": kel.jmlPemilihPerempuan,
        "status": 'OPEN'
      },
      { headers })
      .subscribe(val => {
      }, err => {
        this.doPostKel(kel)
      });
  }
  doGetLoopKel() {
    this.api.get("table/z_scan_loop", { params: { limit: 1000, filter: "name='KEL'" } })
      .subscribe(val => {
        let data = val['data'][0]
        this.doGetKelAll(data)
      });
  }
  doGetKelAll(data) {
    this.api.get("table/z_kel", { params: { limit: 1000, filter: "id >=" + data.start_scan + " AND id <=" + data.finish_scan + " AND status='OPEN'" } })
      .subscribe(val => {
        let kelurahan = val['data']
        for (let i = 0; i < kelurahan.length; i++) {
          let kel = kelurahan[i]
          this.doGetJsonTPS(kel)
        }

      }, err => {
        this.doGetKelAll(data)
      });
  }
  doGetJsonTPS(kel) {
    var self = this
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function () {
      if (xhr.readyState == XMLHttpRequest.DONE) {
        if (xhr.status == 200) {
          var datajson = JSON.parse(xhr.responseText)
          let data = datajson.aaData
          for (let i = 0; i < data.length; i++) {
            let tps = data[i]
            self.doPostTPS(tps)
          }
        }
        else if (xhr.status == 404) {

        }
        else if (xhr.status == 301) {

        }
        else if (xhr.status == 500) {

        }
        else {
          self.doGetJsonTPS(kel)
        }
      }
    }
    xhr.onerror = function () {

    };
    xhr.open('GET', 'https://infopemilu.kpu.go.id/pilkada2018/pemilih/dpt/1/' + kel.prov + '/' + kel.kab + '/' + kel.kec + '/' + kel.kel + '/listDps.json', true);
    xhr.send(null);
  }
  doPostTPS(tps) {
    const headers = new HttpHeaders()
      .set("Content-Type", "application/json");
    this.api.post("table/z_tps",
      {
        "prov": tps.namaPropinsi,
        "kab": tps.namaKabKota,
        "kec": tps.namaKecamatan,
        "kel": tps.namaKelurahan,
        "tps": tps.tps,
        "total_pemilih": tps.totalPemilih,
        "pemilih_laki": tps.jmlPemilihLaki,
        "pemilih_perempuan": tps.jmlPemilihPerempuan,
        "status": 'OPEN'
      },
      { headers })
      .subscribe(val => {
      }, err => {
        this.doPostTPS(tps)
      });
  }
}
