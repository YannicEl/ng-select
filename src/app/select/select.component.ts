import {
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter,
  ViewContainerRef,
  NgZone,
  TemplateRef,
  EmbeddedViewRef,
  ChangeDetectorRef,
  forwardRef,
  HostListener,
} from '@angular/core';
import { debounceTime, filter, takeUntil } from 'rxjs/operators';
import { untilDestroyed, UntilDestroy } from '@ngneat/until-destroy';
import {
  FormControl,
  ControlValueAccessor,
  NG_VALUE_ACCESSOR,
} from '@angular/forms';
import { createPopper, Instance } from '@popperjs/core';
import { fromEvent } from 'rxjs';
import { SelectOption } from './selectOptions';

export const EPANDED_TEXTAREA_VALUE_ACCESSOR: any = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => SelectComponent),
  multi: true,
};

@UntilDestroy()
@Component({
  selector: 'app-select',
  templateUrl: './select.component.html',
  styleUrls: ['./select.component.scss'],
  providers: [EPANDED_TEXTAREA_VALUE_ACCESSOR],
})
export class SelectComponent implements OnInit, ControlValueAccessor {
  @Input() model;
  @Input() placeholder: string;
  @Input() visibleOptions = 4;
  @Input() options: SelectOption[] = [];
  @Output() closed = new EventEmitter();

  searchControl = new FormControl();

  private view: EmbeddedViewRef<any>;
  private popperRef: Instance;
  private originalOptions: SelectOption[] = [];

  // Required for ControlValueAccessor
  onChange;
  onTouched;

  constructor(
    private vcr: ViewContainerRef,
    private zone: NgZone,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.originalOptions = [...this.options];

    if (this.model !== undefined) {
      this.model = this.options.find(
        (currentOption) => currentOption.key === this.model
      );
    }

    this.searchControl.valueChanges
      .pipe(debounceTime(300), untilDestroyed(this))
      .subscribe((term) => this.search(term));
  }

  /**
   * Searches and fitlers the options array
   * @param value searchvalue
   */
  search(value: string) {
    this.options = this.originalOptions.filter((option) =>
      option.value.includes(value)
    );
    this.visibleOptions = this.options.length || 1;
  }

  /**
   * Creates a dropdown below the origin element
   * @param dropdownTpl Template of the dropdown
   * @param origin Origin HTML element
   */
  open(dropdownTpl: TemplateRef<any>, origin: HTMLElement) {
    this.view = this.vcr.createEmbeddedView(dropdownTpl);
    const dropdown = this.view.rootNodes[0];

    document.body.appendChild(dropdown);
    dropdown.style.width = `${origin.offsetWidth}px`;

    this.zone.runOutsideAngular(() => {
      this.popperRef = createPopper(origin, dropdown, {});
    });
    this.handleClickOutside();
  }

  /**
   * Closes dropdown if clicks outside the dropdown happen
   */
  private handleClickOutside() {
    fromEvent(document, 'click')
      .pipe(
        filter(({ target }) => {
          const origin = this.popperRef.state.elements.reference as HTMLElement;
          return origin.contains(target as HTMLElement) === false;
        }),
        takeUntil(this.closed)
      )
      .subscribe(() => {
        this.close();
        this.cdr.detectChanges();
      });
  }

  /**
   * Called after a option in the dropdown has been slected
   * @param option selected option
   */
  select(option: SelectOption) {
    this.model = option;
    this.searchControl.setValue(option.value);
    this.onChange(option);
  }

  /**
   * Closes the dropdown
   */
  close() {
    this.closed.emit();
    this.popperRef?.destroy();
    this.view?.destroy();
    this.view = null;
    this.popperRef = null;
  }

  // TODO: fires a lot of events which is extremly inperformant
  @HostListener('window:resize')
  public onWinResize() {
    this.close();
  }

  isActive(option) {
    if (!this.model) {
      return false;
    }
    return option.key === this.model.key;
  }

  // Required for ControlValueAccessor
  writeValue(obj: any): void {
    this.model = obj;
  }

  // Required for ControlValueAccessor
  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  // Required for ControlValueAccessor
  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  // Required for ControlValueAccessor
  setDisabledState?(isDisabled: boolean): void {
    if (isDisabled) {
      this.searchControl.disable();
    } else {
      this.searchControl.enable();
    }
  }
}
