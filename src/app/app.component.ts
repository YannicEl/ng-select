import { Component, OnInit } from '@angular/core';
import { SelectOption } from './select/selectOptions';
import { FormControl } from '@angular/forms';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  select = new FormControl();
  options: SelectOption[] = [];

  ngOnInit(): void {
    for (let i = 0; i < 1000000; i++) {
      this.options.push({ key: i, value: 'hi ' + i });
    }
  }
}
