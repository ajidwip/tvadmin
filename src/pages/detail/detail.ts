import { Component } from '@angular/core';
import { NavParams, IonicPage, NavController, LoadingController, Platform, ToastController, AlertController } from 'ionic-angular';
import { HttpHeaders } from "@angular/common/http";
import { ApiProvider } from '../../providers/api/api';
import moment from 'moment';
import { Storage } from '@ionic/storage';

declare var Email;
declare var gapi;
declare var html2json;
declare var json2html;

@IonicPage()
@Component({
  selector: 'page-detail',
  templateUrl: 'detail.html',
})
export class DetailPage {

  public provinsi = [];

  constructor(
    public navparam: NavParams,
    public toastCtrl: ToastController,
    public navCtrl: NavController,
    public api: ApiProvider,
    public loadingCtrl: LoadingController,
    public platform: Platform,
    public alertCtrl: AlertController,
    private storage: Storage) {
    this.doGetProv()
  }
  doGetProv() {
    this.api.get("table/z_prov", { params: { limit: 1000, filter: "status='OPEN'" } })
      .subscribe(val => {
        this.provinsi = val['data']

      }, err => {
        this.doGetProv()
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
    xhr.open('GET', 'https://infopemilu.kpu.go.id/pilkada2018/pemilih/dpt/1/' + prov.prov +'/listDps.json', true);
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
  getNextNoUrl() {
    return this.api.get('nextno/z_kab/id')
  }
  doPostKab(kab) {
    this.getNextNoUrl().subscribe(val => {
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
}
