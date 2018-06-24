import { Component } from '@angular/core';
import { NavController, LoadingController, Platform, ToastController, AlertController } from 'ionic-angular';
import { HttpHeaders } from "@angular/common/http";
import { ApiProvider } from '../../providers/api/api';

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {
  public channels = [];
  constructor(
    public toastCtrl: ToastController,
    public navCtrl: NavController,
    public api: ApiProvider,
    public loadingCtrl: LoadingController,
    public platform: Platform,
    public alertCtrl: AlertController) {
    setInterval(() => {
      this.doGet();
    }, 300000);
    this.doGetChannel();
  }
  doGetChannel() {
    this.channels = [];
    this.api.get("table/z_channel", { params: { limit: 1000, filter: "name='Premium TV'" } })
      .subscribe(val => {
        this.channels = val['data']
      });
  }
  doGet() {
    this.api.get("table/z_premium", { params: { limit: 1000 } })
      .subscribe(val => {
        let data = val['data'];
        for (let i = 0; i < data.length; i++) {
          let dataarray = data[i]
          let loader = this.loadingCtrl.create({
            // cssClass: 'transparent',
            content: 'Get ' + data[i].name + " Channel"
          });
          loader.present().then(() => {
            this.doGetLink(dataarray)
            if (i == (data.length - 1)) {
              this.doGetChannel();
              console.log('refresh')
            }
            loader.dismiss();
          });
        }
      });
  }
  doGetLink(dataarray) {
    var self = this
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function () {
      if (xhr.readyState == XMLHttpRequest.DONE) {
        var url = xhr.responseText.substring(dataarray.subsurl_1, dataarray.subsurl_2)
        var body = xhr.responseText.substring(dataarray.subsbody_1, dataarray.subsbody_2)
        xhr.onload = () => {
          const headers = new HttpHeaders()
            .set("Content-Type", "application/json");
          self.api.put("table/z_channel",
            {
              "id": dataarray.id_channel,
              "url": body,
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
}
