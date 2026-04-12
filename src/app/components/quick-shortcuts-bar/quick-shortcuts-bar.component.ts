import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/user.model';

/** Atajos globales (misma lista que el bloque central del navbar). */
@Component({
  selector: 'app-quick-shortcuts-bar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './quick-shortcuts-bar.component.html',
  styleUrls: ['./quick-shortcuts-bar.component.css'],
  host: {
    '[class.qs-host--navbar]': 'variant === "navbar"',
    '[class.qs-host--content]': 'variant === "content"'
  }
})
export class QuickShortcutsBarComponent {
  /** `navbar`: barra superior (tablet/desktop). `content`: bajo el navbar solo en móvil. */
  @Input() variant: 'navbar' | 'content' = 'navbar';

  currentUser: User | null = null;

  constructor(private authService: AuthService) {
    this.authService.currentUser$.subscribe((u) => (this.currentUser = u));
  }
}
