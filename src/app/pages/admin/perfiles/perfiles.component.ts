import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { MenuService, Perfil, MenuItem, PerfilMenuAcceso, PermisosUpdate } from '../../../services/menu.service';
import { ErrorHandlerService } from '../../../services/error-handler.service';
import { SnackbarService } from '../../../services/snackbar.service';

@Component({
  selector: 'app-perfiles',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './perfiles.component.html',
  styleUrls: ['./perfiles.component.css']
})
export class PerfilesComponent implements OnInit {
  perfiles: Perfil[] = [];
  menuItems: MenuItem[] = [];
  permisos: Map<number, PerfilMenuAcceso> = new Map(); // menu_item_id -> PerfilMenuAcceso
  
  selectedPerfil: Perfil | null = null;
  loading = false;
  saving = false;
  expandedItems: Set<number> = new Set();

  constructor(
    private menuService: MenuService,
    private errorHandler: ErrorHandlerService,
    private snackbar: SnackbarService
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  async loadData(): Promise<void> {
    this.loading = true;
    try {
      const [perfilesRes, menuRes] = await Promise.all([
        firstValueFrom(this.menuService.getPerfiles()),
        firstValueFrom(this.menuService.getMenuItems())
      ]);

      if (perfilesRes?.success) {
        this.perfiles = perfilesRes.data;
      }

      if (menuRes?.success) {
        this.menuItems = menuRes.data;
        // Expandir todos los encabezados por defecto
        this.menuItems.forEach(item => {
          if (item.tipo === 'encabezado') {
            this.expandedItems.add(item.id);
          }
        });
      }

      // Si hay un perfil seleccionado, cargar sus permisos
      if (this.selectedPerfil) {
        await this.loadPermisos(this.selectedPerfil.id);
      }
    } catch (error) {
      this.errorHandler.logError(error, 'cargar datos de perfiles');
      const errorMessage = this.errorHandler.getSafeErrorMessage(error, 'cargar datos');
      this.snackbar.showError(errorMessage);
    } finally {
      this.loading = false;
    }
  }

  async selectPerfil(perfil: Perfil): Promise<void> {
    this.selectedPerfil = perfil;
    await this.loadPermisos(perfil.id);
  }

  async loadPermisos(perfilId: number): Promise<void> {
    try {
      const res = await firstValueFrom(this.menuService.getPermisosByPerfil(perfilId));
      if (res?.success) {
        this.permisos.clear();
        res.data.forEach(permiso => {
          this.permisos.set(permiso.menu_item_id, permiso);
        });
      }
    } catch (error) {
      this.errorHandler.logError(error, 'cargar permisos');
      const errorMessage = this.errorHandler.getSafeErrorMessage(error, 'cargar permisos');
      this.snackbar.showError(errorMessage);
    }
  }

  getPermiso(menuItemId: number): PerfilMenuAcceso | null {
    return this.permisos.get(menuItemId) || null;
  }

  toggleItem(itemId: number): void {
    if (this.expandedItems.has(itemId)) {
      this.expandedItems.delete(itemId);
    } else {
      this.expandedItems.add(itemId);
    }
  }

  isExpanded(itemId: number): boolean {
    return this.expandedItems.has(itemId);
  }

  async togglePermiso(
    menuItemId: number,
    campo: keyof Omit<PerfilMenuAcceso, 'id' | 'perfil_id' | 'menu_item_id'>
  ): Promise<void> {
    if (!this.selectedPerfil) return;

    const permiso = this.getPermiso(menuItemId);
    const nuevoValor = permiso ? !permiso[campo] : true;

    try {
      const res = await firstValueFrom(this.menuService.updatePermisos(
        this.selectedPerfil.id,
        menuItemId,
        { [campo]: nuevoValor }
      ));

      if (res?.success) {
        this.permisos.set(menuItemId, res.data);
      }
    } catch (error) {
      this.errorHandler.logError(error, 'actualizar permiso');
      const errorMessage = this.errorHandler.getSafeErrorMessage(error, 'actualizar permiso');
      this.snackbar.showError(errorMessage);
    }
  }

  async saveAllPermisos(): Promise<void> {
    if (!this.selectedPerfil) return;

    this.saving = true;
    try {
      // Recopilar todos los permisos modificados
      const permisosUpdate: PermisosUpdate[] = [];
      
      const collectPermisos = (items: MenuItem[]) => {
        items.forEach(item => {
          const permiso = this.getPermiso(item.id);
          if (permiso) {
            permisosUpdate.push({
              menu_item_id: item.id,
              puede_acceder: permiso.puede_acceder,
              puede_crear: permiso.puede_crear,
              puede_editar: permiso.puede_editar,
              puede_eliminar: permiso.puede_eliminar,
              puede_finalizar: permiso.puede_finalizar,
              puede_completar: permiso.puede_completar,
              puede_ver_servicios: permiso.puede_ver_servicios
            });
          }
          if (item.hijos) {
            collectPermisos(item.hijos);
          }
        });
      };

      collectPermisos(this.menuItems);

      const res = await firstValueFrom(this.menuService.updatePermisosBulk(
        this.selectedPerfil.id,
        permisosUpdate
      ));

      if (res?.success) {
        this.snackbar.showSuccess('Permisos guardados correctamente');
        await this.loadPermisos(this.selectedPerfil.id);
      }
    } catch (error) {
      this.errorHandler.logError(error, 'guardar permisos');
      const errorMessage = this.errorHandler.getSafeErrorMessage(error, 'guardar permisos');
      this.snackbar.showError(errorMessage);
    } finally {
      this.saving = false;
    }
  }

  getPermisoValue(menuItemId: number, campo: keyof Omit<PerfilMenuAcceso, 'id' | 'perfil_id' | 'menu_item_id'>): boolean {
    const permiso = this.getPermiso(menuItemId);
    return permiso ? permiso[campo] : false;
  }

  hasChildren(item: MenuItem): boolean {
    return !!(item.hijos && item.hijos.length > 0);
  }
}

