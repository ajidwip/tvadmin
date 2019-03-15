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
  selector: 'page-detailkel',
  templateUrl: 'detailkel.html',
})
export class DetailkelPage {

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
  }
  doGetProv() {
    this.api.get("table/z_prov", { params: { limit: 1000, filter: "status='OPEN'" } })
    .subscribe(val => {
      this.provinsi = val['data']

    }, err => {
      this.doGetProv()
    });
  }
}
