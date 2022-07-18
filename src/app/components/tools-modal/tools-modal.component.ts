import { Component, OnInit } from '@angular/core';
import {BsModalRef, BsModalService} from 'ngx-bootstrap/modal';
import {Tools} from '../../shared/models/tools';

@Component({
  selector: 'app-tools-modal',
  templateUrl: './tools-modal.component.html',
  styleUrls: ['./tools-modal.component.scss']
})
export class ToolsModalComponent implements OnInit {

  closeBtnName?: string;
  tool?: Tools;
  constructor(public bsModalRef: BsModalRef) { }

  ngOnInit(): void {
  }

}
