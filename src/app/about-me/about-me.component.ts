import { Component, HostListener } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';

interface ReadingItem {
  title: string;
  subtitle: string;
  file: string;          // relative path under assets/pdfs
  src?: SafeResourceUrl; // sanitized iframe src
  download: string;
}

@Component({
  selector: 'app-about-me',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './about-me.component.html',
  styleUrls: ['./about-me.component.css']
})
export class AboutMeComponent {

  readingItems: ReadingItem[] = [
    {
      title: 'Development Thinking',
      subtitle: 'Foundational perspectives',
      file: 'development-thinking.pdf',
      download: 'assets/pdfs/development-thinking.pdf'
    },
    {
      title: 'Research Article',
      subtitle: 'Sensory integration overview',
      file: 'OARArticle.pdf',
      download: 'assets/pdfs/OARArticle.pdf'
    },
    {
      title: 'Feeding Reflexe',
      subtitle: 'Rooting, sucking & regulation',
      file: 'feeding-reflexes.pdf',
      download: 'assets/pdfs/feeding-reflexes.pdf'
    }
  ];

  currentReadingIndex = 0;

  constructor(private sanitizer: DomSanitizer) {
    this.prepareSources();
  }

  private prepareSources(): void {
    this.readingItems.forEach(r => {
      const raw = `assets/pdfs/${r.file}#toolbar=0&navpanes=0&scrollbar=0`;
      r.src = this.sanitizer.bypassSecurityTrustResourceUrl(raw);
    });
  }

  get currentReading(): ReadingItem {
    return this.readingItems[this.currentReadingIndex];
  }

  get nextReadingTitle(): string | null {
    return this.readingItems[this.currentReadingIndex + 1]?.title || null;
  }
  get prevReadingTitle(): string | null {
    return this.readingItems[this.currentReadingIndex - 1]?.title || null;
  }

  nextReading(): void {
    if (this.currentReadingIndex < this.readingItems.length - 1) {
      this.currentReadingIndex++;
    }
  }
  prevReading(): void {
    if (this.currentReadingIndex > 0) {
      this.currentReadingIndex--;
    }
  }
  goTo(i: number): void {
    this.currentReadingIndex = i;
  }

  @HostListener('window:keydown', ['$event'])
  handleKey(e: KeyboardEvent): void {
    if (e.key === 'ArrowRight') {
      this.nextReading();
    } else if (e.key === 'ArrowLeft') {
      this.prevReading();
    }
  }
}

