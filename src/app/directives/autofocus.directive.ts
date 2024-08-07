import { Directive, ElementRef, inject, OnInit } from '@angular/core';
import { MatInput } from '@angular/material/input';

@Directive({
  selector: '[matInputAutofocus]',
  standalone: true
})
export class AutofocusDirective implements OnInit {

  private readonly elementRef = inject(ElementRef);

  ngOnInit() {
    setTimeout(() => this.elementRef.nativeElement.focus());
  }
}
