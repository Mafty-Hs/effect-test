import { Component ,OnInit ,AfterViewInit,ViewChild, ElementRef } from '@angular/core';
import { EffectService } from './service/effect.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, AfterViewInit{
  @ViewChild('effect1', { read: ElementRef, static: true }) effect1?:ElementRef;
  @ViewChild('effect2', { read: ElementRef, static: true }) effect2?:ElementRef;

  ngOnInit(): void {

  }

  ngAfterViewInit(): void {
    this.effectService.initialize();
  }

  constructor(
    private effectService:EffectService
  ) {}

  play() {
    this.playLeft();
    this.playRight();
  }

  async playLeft() {
    let element = this.effect1.nativeElement;
    if (element) {
      let rect = element.getBoundingClientRect();
      this.effectService.play(rect,'氷',true);
    }
  }

  async playRight() {
    let element = this.effect2.nativeElement;
    if (element) {
      let rect = element.getBoundingClientRect();
      this.effectService.play(rect,'氷',false);
    }
  }
}
