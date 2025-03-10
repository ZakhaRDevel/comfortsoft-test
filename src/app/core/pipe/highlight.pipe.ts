import {inject, Pipe, PipeTransform} from '@angular/core';
import {DomSanitizer, SafeHtml} from '@angular/platform-browser';

@Pipe({
  name: 'highlight',
  standalone: true
})
export class HighlightPipe implements PipeTransform {
  private sanitizer = inject(DomSanitizer);

  transform(text: string, search: string): SafeHtml {
    if (!search.trim()) {
      return text;
    }

    const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escapedSearch})`, 'gi');
    const highlightedText = text.replace(regex, '<span class="highlight">$1</span>');

    return this.sanitizer.bypassSecurityTrustHtml(highlightedText);
  }
}
