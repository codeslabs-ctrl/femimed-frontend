import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, OnChanges, SimpleChanges, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import Quill from 'quill';

@Component({
  selector: 'app-rich-text-editor',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="rich-text-editor">
      <div #editorContainer class="editor-container"></div>
    </div>
  `,
  styles: [`
    .rich-text-editor {
      border: 1px solid #ddd;
      border-radius: 4px;
      overflow: hidden;
    }
    
    .editor-container {
      min-height: 120px;
    }
    
    :host ::ng-deep .ql-toolbar {
      border-bottom: 1px solid #ddd;
      background-color: #f8f9fa;
    }
    
    :host ::ng-deep .ql-container {
      border: none;
      font-family: inherit;
    }
    
    :host ::ng-deep .ql-editor {
      min-height: 100px;
      padding: 12px;
    }
    
    :host ::ng-deep .ql-editor.ql-blank::before {
      font-style: normal;
      color: #999;
    }
  `]
})
export class RichTextEditorComponent implements OnInit, OnDestroy, OnChanges {
  @Input() value: string = '';
  @Input() placeholder: string = 'Escribe aquí...';
  @Input() height: number = 120;
  @Output() valueChange = new EventEmitter<string>();
  
  @ViewChild('editorContainer', { static: true }) editorContainer!: ElementRef;
  
  private quill!: Quill;
  
  ngOnInit() {
    this.initializeQuill();
  }
  
  ngOnDestroy() {
    if (this.quill) {
      this.quill.off('text-change');
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['value'] && this.quill) {
      const newValue = changes['value'].currentValue || '';
      const currentValue = this.quill.root.innerHTML || '';
      
      // Comparar valores normalizados (sin espacios en blanco al inicio/final y sin etiquetas vacías)
      const normalizedNew = newValue.trim().replace(/<p><br><\/p>/g, '').replace(/<p><\/p>/g, '');
      const normalizedCurrent = currentValue.trim().replace(/<p><br><\/p>/g, '').replace(/<p><\/p>/g, '');
      
      if (normalizedNew !== normalizedCurrent) {
        console.log('🔄 RichTextEditor: Actualizando contenido, length:', newValue.length);
        // Usar setContents en lugar de innerHTML para mejor compatibilidad con Quill
        try {
          const delta = this.quill.clipboard.convert({ html: newValue });
          this.quill.setContents(delta, 'silent');
        } catch (error) {
          // Fallback a innerHTML si setContents falla
          console.warn('⚠️ Error usando setContents, usando innerHTML:', error);
          this.quill.root.innerHTML = newValue;
        }
      }
    }
  }
  
  private initializeQuill() {
    const toolbarOptions = [
      ['bold', 'italic', 'underline'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'header': [1, 2, 3, false] }],
      ['link'],
      ['clean']
    ];
    
    this.quill = new Quill(this.editorContainer.nativeElement, {
      theme: 'snow',
      placeholder: this.placeholder,
      modules: {
        toolbar: toolbarOptions
      }
    });
    
    // Establecer el valor inicial
    if (this.value) {
      this.quill.root.innerHTML = this.value;
    }
    
    // Escuchar cambios
    this.quill.on('text-change', () => {
      const html = this.quill.root.innerHTML;
      this.valueChange.emit(html);
    });
  }
  
  public setValue(value: string) {
    if (this.quill && value !== this.quill.root.innerHTML) {
      this.quill.root.innerHTML = value;
    }
  }
  
  public getValue(): string {
    return this.quill ? this.quill.root.innerHTML : '';
  }
}