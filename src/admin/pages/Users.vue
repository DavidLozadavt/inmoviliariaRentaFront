<template>
  <div class="rx-users">
    <!-- ═══════ TOP BAR ═══════ -->
    <header class="rx-topbar">
      <div class="rx-topbar__left">
        <div class="rx-topbar__icon">
          <font-awesome-icon :icon="['fas', 'users']" />
        </div>
        <div>
          <h1 class="rx-topbar__title">Usuarios</h1>
          <p class="rx-topbar__sub">Administra cuentas, roles y permisos de la plataforma</p>
        </div>
      </div>
      <button class="rx-btn rx-btn--accent" @click="openCreateModal">
        <font-awesome-icon :icon="['fas', 'user-plus']" /> Nuevo Usuario
      </button>
    </header>

    <!-- ═══════ KPI STRIP ═══════ -->
    <section class="rx-kpi-strip">
      <div class="rx-kpi" style="--kpi-hue: 230">
        <div class="rx-kpi__icon"><font-awesome-icon :icon="['fas', 'users']" /></div>
        <div class="rx-kpi__body">
          <span class="rx-kpi__val">{{ stats.total }}</span>
          <span class="rx-kpi__label">Total</span>
        </div>
      </div>
      <div class="rx-kpi" style="--kpi-hue: 155">
        <div class="rx-kpi__icon"><font-awesome-icon :icon="['fas', 'user-check']" /></div>
        <div class="rx-kpi__body">
          <span class="rx-kpi__val">{{ stats.active }}</span>
          <span class="rx-kpi__label">Activos</span>
        </div>
        <span class="rx-kpi__pct" v-if="stats.total">{{ pctOf(stats.active, stats.total) }}%</span>
      </div>
      <div class="rx-kpi" style="--kpi-hue: 35">
        <div class="rx-kpi__icon"><font-awesome-icon :icon="['fas', 'user-clock']" /></div>
        <div class="rx-kpi__body">
          <span class="rx-kpi__val">{{ stats.pending }}</span>
          <span class="rx-kpi__label">Pendientes</span>
        </div>
      </div>
      <div class="rx-kpi" style="--kpi-hue: 0">
        <div class="rx-kpi__icon"><font-awesome-icon :icon="['fas', 'user-lock']" /></div>
        <div class="rx-kpi__body">
          <span class="rx-kpi__val">{{ stats.suspended }}</span>
          <span class="rx-kpi__label">Suspendidos</span>
        </div>
      </div>
    </section>

    <!-- ═══════ TOOLBAR ═══════ -->
    <section class="rx-toolbar">
      <div class="rx-search">
        <font-awesome-icon :icon="['fas', 'search']" class="rx-search__ico" />
        <input type="text" class="rx-search__input" placeholder="Buscar por nombre, email o teléfono…"
          v-model="filters.search" @input="debouncedSearch" />
        <button v-if="filters.search" class="rx-search__clear" @click="clearSearch"><font-awesome-icon
            :icon="['fas', 'times']" /></button>
      </div>
      <div class="rx-filters">
        <select class="rx-select" v-model="filters.role" @change="applyFilters">
          <option value="">Rol: Todos</option>
          <option value="admin">Administrador</option>
          <option value="support">Soporte</option>
          <option value="user">Usuario</option>
        </select>
        <select class="rx-select" v-model="filters.status" @change="applyFilters">
          <option value="">Estado: Todos</option>
          <option value="active">Activo</option>
          <option value="pending">Pendiente</option>
          <option value="inactive">Inactivo</option>
          <option value="suspended">Suspendido</option>
        </select>
        <select class="rx-select" v-model="filters.verification_status" @change="applyFilters">
          <option value="">Verificación: Todas</option>
          <option value="verified">Verificado</option>
          <option value="pending">No verificado</option>
        </select>
        <button v-if="hasActiveFilters" class="rx-btn rx-btn--ghost" @click="clearFilters">
          <font-awesome-icon :icon="['fas', 'times-circle']" /> Limpiar
        </button>
      </div>
    </section>

    <!-- ═══════ DATA GRID ═══════ -->
    <section class="rx-datagrid">
      <div v-if="loading" class="rx-state">
        <div class="rx-spinner"></div>
        <p>Cargando usuarios…</p>
      </div>
      <div v-else-if="error" class="rx-state"><font-awesome-icon :icon="['fas', 'exclamation-triangle']"
          class="rx-state__icon" />
        <h3>Error</h3>
        <p>{{ error }}</p><button class="rx-btn rx-btn--accent" @click="loadUsers">Reintentar</button>
      </div>
      <div v-else-if="users.length === 0" class="rx-state"><font-awesome-icon :icon="['fas', 'users']"
          class="rx-state__icon" />
        <h3>Sin usuarios</h3>
        <p>{{ hasActiveFilters ? 'Ajusta los filtros' : 'No hay usuarios registrados' }}</p>
      </div>
      <div v-else class="rx-table-wrap">
        <table class="rx-table">
          <thead>
            <tr>
              <th @click="sortBy('name')" class="rx-th--sortable">Usuario <font-awesome-icon
                  :icon="['fas', getSortIconFA('name')]" class="rx-sort" :class="{ active: filters.sortBy === 'name' }" />
              </th>
              <th @click="sortBy('role')" class="rx-th--sortable">Rol <font-awesome-icon
                  :icon="['fas', getSortIconFA('role')]" class="rx-sort" :class="{ active: filters.sortBy === 'role' }" />
              </th>
              <th @click="sortBy('status')" class="rx-th--sortable">Estado <font-awesome-icon
                  :icon="['fas', getSortIconFA('status')]" class="rx-sort"
                  :class="{ active: filters.sortBy === 'status' }" /></th>
              <th>Verificación</th>
              <th @click="sortBy('created_at')" class="rx-th--sortable">Registrado <font-awesome-icon
                  :icon="['fas', getSortIconFA('created_at')]" class="rx-sort"
                  :class="{ active: filters.sortBy === 'created_at' }" /></th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in users" :key="user.id" class="rx-row">
              <td>
                <div class="rx-user-cell">
                  <div class="rx-avatar-wrap">
                    <img v-if="user.photo" :src="user.photo" :alt="user.name" class="rx-avatar-img"
                      @error="(e: Event) => ((e.target as HTMLImageElement).style.display = 'none')" />
                    <div v-else class="rx-avatar">{{ getInitials(user.name) }}</div>
                  </div>
                  <div class="rx-user-cell__info">
                    <span class="rx-user-cell__name">{{ user.name }}</span>
                    <span class="rx-user-cell__sub">{{ user.email }}</span>
                  </div>
                </div>
              </td>
              <td>
                <span class="rx-badge"
                  :style="{ color: getRoleConfig(user.role).color, background: getRoleConfig(user.role).bg }">
                  {{ getRoleConfig(user.role).label }}
                </span>
              </td>
              <td>
                <span class="rx-badge"
                  :style="{ color: getStatusConfig(user.status).color, background: getStatusConfig(user.status).bg }">
                  {{ getStatusConfig(user.status).label }}
                </span>
              </td>
              <td>
                <span class="rx-verif"
                  :class="user.verification_status === 'verified' ? 'rx-verif--yes' : 'rx-verif--no'">
                  <font-awesome-icon
                    :icon="['fas', user.verification_status === 'verified' ? 'check-circle' : 'clock']" />
                  {{ user.verification_status === 'verified' ? 'Verificado' : 'Pendiente' }}
                </span>
              </td>
              <td><span class="rx-date">{{ formatTimeAgo(user.created_at) }}</span></td>
              <td>
                <div class="rx-actions">
                  <button class="rx-act rx-act--edit" @click="openEditModal(user)" title="Editar"><font-awesome-icon
                      :icon="['fas', 'pen']" /></button>
                  <button class="rx-act" :class="user.status === 'active' ? 'rx-act--reject' : 'rx-act--approve'"
                    @click="toggleUserStatus(user)" :title="user.status === 'active' ? 'Desactivar' : 'Activar'"
                    :disabled="statusUpdateLoading[user.id]">
                    <font-awesome-icon
                      :icon="['fas', statusUpdateLoading[user.id] ? 'spinner' : (user.status === 'active' ? 'lock' : 'lock-open')]"
                      :spin="statusUpdateLoading[user.id]" />
                  </button>
                  <button class="rx-act rx-act--delete" @click="confirmDelete(user)" title="Eliminar"><font-awesome-icon
                      :icon="['fas', 'trash']" /></button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-if="pagination.lastPage > 1" class="rx-pagination">
          <button class="rx-pg-btn" :disabled="pagination.currentPage === 1 || paginationLoading"
            @click="changePage(pagination.currentPage - 1)">
            <font-awesome-icon :icon="['fas', 'chevron-left']" /> Anterior
          </button>
          <div class="rx-pg-pages">
            <button v-for="page in visiblePages" :key="page" class="rx-pg-page"
              :class="{ active: page === pagination.currentPage }" @click="changePage(page)"
              :disabled="page === '...' || paginationLoading">{{ page }}</button>
          </div>
          <span class="rx-pg-info">Pág. {{ pagination.currentPage }}/{{ pagination.lastPage }} · {{ pagination.total }}
            usuarios</span>
          <button class="rx-pg-btn" :disabled="pagination.currentPage === pagination.lastPage || paginationLoading"
            @click="changePage(pagination.currentPage + 1)">
            Siguiente <font-awesome-icon :icon="['fas', 'chevron-right']" />
          </button>
        </div>
      </div>
    </section>
  </div>

  <!-- ═══════ CREATE / EDIT MODAL ═══════ -->
  <AdminModal v-model="showUserModal" :title="editingUser ? 'Editar Usuario' : 'Nuevo Usuario'"
    :icon="['fas', 'user-edit']" maxWidth="700px" @close="closeUserModal">
    <form id="user-form" @submit.prevent="saveUser" class="rx-form"
      style="display: flex; flex-direction: column; gap: 1.25rem;">
      <div class="rx-form__grid"
        style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.25rem;">
        <div class="rx-form__group rx-form__group--full">
          <label>Nombre completo</label>
          <input v-model="userForm.name" type="text" placeholder="Ej: Juan Pérez" required
            style="width: 100%; padding: 0.65rem 0.85rem; border-radius: 8px; border: 1px solid var(--admin-border); background: var(--admin-surface); color: var(--admin-text-primary); font-family: inherit; font-size: 0.85rem; box-sizing: border-box;" />
        </div>
        <div class="rx-form__group">
          <label>Email</label>
          <input v-model="userForm.email" type="email" placeholder="ejemplo@correo.com" required
            style="width: 100%; padding: 0.65rem 0.85rem; border-radius: 8px; border: 1px solid var(--admin-border); background: var(--admin-surface); color: var(--admin-text-primary); font-family: inherit; font-size: 0.85rem; box-sizing: border-box;" />
        </div>
        <div class="rx-form__group">
          <label>Teléfono</label>
          <input v-model="userForm.phone" type="tel" placeholder="+57 300 123 4567" required
            style="width: 100%; padding: 0.65rem 0.85rem; border-radius: 8px; border: 1px solid var(--admin-border); background: var(--admin-surface); color: var(--admin-text-primary); font-family: inherit; font-size: 0.85rem; box-sizing: border-box;" />
        </div>
        <div class="rx-form__group">
          <label>Rol</label>
          <select v-model="userForm.role" required
            style="width: 100%; padding: 0.65rem 0.85rem; border-radius: 8px; border: 1px solid var(--admin-border); background: var(--admin-surface); color: var(--admin-text-primary); font-family: inherit; font-size: 0.85rem; box-sizing: border-box;">
            <option value="user">Usuario</option>
            <option value="support">Soporte</option>
            <option value="admin">Administrador</option>
          </select>
        </div>
        <div class="rx-form__group">
          <label>Estado</label>
          <select v-model="userForm.status" required
            style="width: 100%; padding: 0.65rem 0.85rem; border-radius: 8px; border: 1px solid var(--admin-border); background: var(--admin-surface); color: var(--admin-text-primary); font-family: inherit; font-size: 0.85rem; box-sizing: border-box;">
            <option value="active">Activo</option>
            <option value="pending">Pendiente</option>
            <option value="inactive">Inactivo</option>
            <option value="suspended">Suspendido</option>
          </select>
        </div>
        <div class="rx-form__group">
          <label>Departamento</label>
          <input v-model="userForm.department" type="text" placeholder="Ej: Cauca"
            style="width: 100%; padding: 0.65rem 0.85rem; border-radius: 8px; border: 1px solid var(--admin-border); background: var(--admin-surface); color: var(--admin-text-primary); font-family: inherit; font-size: 0.85rem; box-sizing: border-box;" />
        </div>
        <div class="rx-form__group">
          <label>Ciudad</label>
          <input v-model="userForm.city" type="text" placeholder="Ej: Popayán"
            style="width: 100%; padding: 0.65rem 0.85rem; border-radius: 8px; border: 1px solid var(--admin-border); background: var(--admin-surface); color: var(--admin-text-primary); font-family: inherit; font-size: 0.85rem; box-sizing: border-box;" />
        </div>
        <div class="rx-form__group rx-form__group--full">
          <label>Dirección</label>
          <input v-model="userForm.address" type="text" placeholder="Calle 5 # 10-20" :required="!editingUser"
            style="width: 100%; padding: 0.65rem 0.85rem; border-radius: 8px; border: 1px solid var(--admin-border); background: var(--admin-surface); color: var(--admin-text-primary); font-family: inherit; font-size: 0.85rem; box-sizing: border-box;" />
        </div>
        <div class="rx-form__group rx-form__group--full">
          <label>Documento de identidad</label>
          <input v-model="userForm.id_documento" type="text" placeholder="CC 1234567890" :required="!editingUser"
            style="width: 100%; padding: 0.65rem 0.85rem; border-radius: 8px; border: 1px solid var(--admin-border); background: var(--admin-surface); color: var(--admin-text-primary); font-family: inherit; font-size: 0.85rem; box-sizing: border-box;" />
        </div>
        <div class="rx-form__group rx-form__group--full">
          <label>Foto de perfil (opcional)</label>
          <input type="file" accept="image/*" @change="handlePhotoUpload"
            style="width: 100%; padding: 0.5rem 0; font-size: 0.85rem; color: var(--admin-text-primary);" />
          <small style="display: block; font-size: 0.75rem; color: var(--admin-text-muted); margin-top: 0.25rem;">JPEG,
            PNG, GIF. Máx: 10MB</small>
        </div>
        <div v-if="!editingUser" class="rx-form__group rx-form__group--full">
          <label>Contraseña</label>
          <input v-model="userForm.password" type="password" placeholder="Mínimo 8 caracteres" required
            style="width: 100%; padding: 0.65rem 0.85rem; border-radius: 8px; border: 1px solid var(--admin-border); background: var(--admin-surface); color: var(--admin-text-primary); font-family: inherit; font-size: 0.85rem; box-sizing: border-box;" />
        </div>
      </div>
    </form>

    <template #footer>
      <button type="button" class="rx-btn rx-btn--ghost" @click="closeUserModal"
        style="padding: 0.65rem 1.25rem; border-radius: 8px; font-weight: 600; font-size: 0.875rem; border: 1px solid var(--admin-border); background: var(--admin-surface); color: var(--admin-text-secondary); cursor: pointer;">Cancelar</button>
      <button type="submit" form="user-form" class="rx-btn rx-btn--accent" :disabled="saving"
        style="padding: 0.65rem 1.25rem; border-radius: 8px; font-weight: 600; font-size: 0.875rem; border: none; background: linear-gradient(135deg, #6366f1, #818cf8); color: #fff; cursor: pointer; box-shadow: 0 2px 8px rgba(99,102,241,0.25);">
        {{ saving ? 'Guardando…' : (editingUser ? 'Actualizar' : 'Crear') }}
      </button>
    </template>
  </AdminModal>

  <!-- ═══════ DELETE MODAL ═══════ -->
  <AdminModal v-model="showDeleteModal" title="¿Eliminar usuario?" :icon="['fas', 'exclamation-triangle']"
    maxWidth="400px" @close="closeDeleteModal">
    <p style="margin: 0; font-size: 0.95rem; line-height: 1.5; color: var(--admin-text-secondary);">
      Esta acción eliminará permanentemente a <strong style="color: var(--admin-text-primary);">{{ userToDelete?.name
        }}</strong>. No se puede deshacer.
    </p>

    <template #footer>
      <button class="rx-btn rx-btn--ghost" @click="closeDeleteModal"
        style="padding: 0.65rem 1.25rem; border-radius: 8px; font-weight: 600; font-size: 0.875rem; border: 1px solid var(--admin-border); background: var(--admin-surface); color: var(--admin-text-secondary); cursor: pointer;">Cancelar</button>
      <button class="rx-btn rx-btn--danger" @click="deleteUser" :disabled="deleting"
        style="padding: 0.65rem 1.25rem; border-radius: 8px; font-weight: 600; font-size: 0.875rem; border: none; background: #ef4444; color: #fff; cursor: pointer;">
        {{ deleting ? 'Eliminando…' : 'Eliminar' }}
      </button>
    </template>
  </AdminModal>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import AdminModal from '@/admin/components/AdminModal.vue';
import { userManagementService, type User, type UserStats } from '../../services/userManagementService';
import { eventBus } from '../../events/eventBus';
import { useAlerts } from '../../composables/useAlerts';

const { success, error: showError } = useAlerts();

const users = ref<User[]>([]);
const stats = ref<UserStats>({ total: 0, active: 0, inactive: 0, pending: 0, suspended: 0, byRole: { user: 0, admin: 0, support: 0 } });
const loading = ref(true);
const error = ref('');
const statusUpdateLoading = ref<Record<number, boolean>>({});
const paginationLoading = ref(false);

const filters = ref({ search: '', role: '', status: '', verification_status: '', page: 1, perPage: 10, sortBy: 'created_at', sortOrder: 'desc' as 'asc' | 'desc' });
const pagination = ref({ currentPage: 1, lastPage: 1, perPage: 10, total: 0 });

const showUserModal = ref(false);
const showDeleteModal = ref(false);
const editingUser = ref<User | null>(null);
const userToDelete = ref<User | null>(null);
const saving = ref(false);
const deleting = ref(false);

const userForm = ref({ name: '', email: '', phone: '', role: 'user' as 'user' | 'admin' | 'support', status: 'active' as string, address: '', id_documento: '', department: '', city: '', password: '', photo: null as File | null });

const hasActiveFilters = computed(() => filters.value.search !== '' || filters.value.role !== '' || filters.value.status !== '' || filters.value.verification_status !== '');
const pctOf = (part: number, total: number) => total > 0 ? Math.round((part / total) * 100) : 0;

const visiblePages = computed(() => {
  const current = pagination.value.currentPage;
  const last = pagination.value.lastPage;
  const delta = 2;
  const range: number[] = [];
  const rangeWithDots: (number | string)[] = [];
  for (let i = 1; i <= last; i++) { if (i === 1 || i === last || (i >= current - delta && i <= current + delta)) range.push(i); }
  let prev = 0;
  for (const i of range) { if (prev) { if (i - prev === 2) rangeWithDots.push(prev + 1); else if (i - prev !== 1) rangeWithDots.push('...'); } rangeWithDots.push(i); prev = i; }
  return rangeWithDots;
});

const loadUsers = async () => {
  try {
    loading.value = true; error.value = '';
    const response = await userManagementService.getUsers(filters.value);
    users.value = response.data;
    pagination.value = { currentPage: response.meta.current_page, lastPage: response.meta.last_page, perPage: response.meta.per_page, total: response.meta.total };
  } catch (err: any) { error.value = err.response?.data?.message || 'Error al cargar usuarios'; showError('Error al cargar usuarios', 'Error'); }
  finally { loading.value = false; paginationLoading.value = false; }
};
const loadStats = async () => { try { stats.value = await userManagementService.getUserStats(); } catch (err) { console.error(err); } };

let searchTimeout: ReturnType<typeof setTimeout>;
const debouncedSearch = () => { clearTimeout(searchTimeout); searchTimeout = setTimeout(() => { filters.value.page = 1; pagination.value.currentPage = 1; loadUsers(); }, 500); };
const clearSearch = () => { filters.value.search = ''; filters.value.page = 1; pagination.value.currentPage = 1; loadUsers(); };
const applyFilters = () => { filters.value.page = 1; pagination.value.currentPage = 1; loadUsers(); };
const clearFilters = () => { filters.value = { ...filters.value, search: '', role: '', status: '', verification_status: '', page: 1 }; pagination.value.currentPage = 1; loadUsers(); };
const sortBy = (field: string) => { if (filters.value.sortBy === field) { filters.value.sortOrder = filters.value.sortOrder === 'asc' ? 'desc' : 'asc'; } else { filters.value.sortBy = field; filters.value.sortOrder = 'asc'; } filters.value.page = 1; pagination.value.currentPage = 1; loadUsers(); };
const getSortIconFA = (field: string): string => { if (filters.value.sortBy !== field) return 'sort'; return filters.value.sortOrder === 'asc' ? 'sort-up' : 'sort-down'; };
const changePage = (page: number | string) => { if (typeof page === 'string') return; if (page < 1 || page > pagination.value.lastPage || page === pagination.value.currentPage) return; paginationLoading.value = true; filters.value.page = page; loadUsers(); };

const handlePhotoUpload = (event: Event) => { const input = event.target as HTMLInputElement; if (input.files && input.files[0]) userForm.value.photo = input.files[0]; };
const openCreateModal = () => { editingUser.value = null; userForm.value = { name: '', email: '', phone: '', role: 'user', status: 'active', address: '', id_documento: '', department: '', city: '', password: '', photo: null }; showUserModal.value = true; };
const openEditModal = (user: User) => { editingUser.value = user; userForm.value = { name: user.name, email: user.email, phone: user.phone, role: user.role, status: user.status, address: user.address, id_documento: user.id_documento, department: user.department || '', city: user.city || '', password: '', photo: null }; showUserModal.value = true; };
const closeUserModal = () => { showUserModal.value = false; editingUser.value = null; };

const saveUser = async () => {
  try {
    saving.value = true;
    const formData = new FormData();
    Object.keys(userForm.value).forEach(key => {
      const value = userForm.value[key as keyof typeof userForm.value];
      if (key === 'photo') return;
      if (editingUser.value && (value === '' || value === null)) return;
      if (key === 'password' && editingUser.value && !value) return;
      if (value !== null && value !== undefined) formData.append(key, value as string);
    });
    if (userForm.value.photo) formData.append('photo', userForm.value.photo);
    if (editingUser.value) { await userManagementService.updateUser(editingUser.value.id, formData); success('Usuario actualizado', 'Éxito'); }
    else { await userManagementService.createUser(formData); success('Usuario creado', 'Éxito'); }
    closeUserModal(); await loadUsers(); await loadStats();
  } catch (err: any) {
    let msg = 'Error al guardar';
    if (err.response?.data?.errors) msg = Object.values(err.response.data.errors).flat().join(', ');
    else if (err.response?.data?.message) msg = err.response.data.message;
    showError(msg, 'Error');
  } finally { saving.value = false; }
};

const toggleUserStatus = async (user: User) => {
  try {
    statusUpdateLoading.value[user.id] = true;
    const newStatus = user.status === 'active' ? 'inactive' : 'active';
    await userManagementService.updateUserStatus(user.id, newStatus);
    success(`Usuario ${newStatus === 'active' ? 'activado' : 'desactivado'}`, 'Éxito');
    const idx = users.value.findIndex(u => u.id === user.id);
    if (idx !== -1) users.value[idx].status = newStatus;
    await loadStats();
  } catch (err: any) { showError(err.response?.data?.message || 'Error', 'Error'); }
  finally { statusUpdateLoading.value[user.id] = false; }
};

const confirmDelete = (user: User) => { userToDelete.value = user; showDeleteModal.value = true; };
const closeDeleteModal = () => { showDeleteModal.value = false; userToDelete.value = null; };
const deleteUser = async () => {
  if (!userToDelete.value) return;
  try { deleting.value = true; await userManagementService.deleteUser(userToDelete.value.id); success('Usuario eliminado', 'Éxito'); closeDeleteModal(); await loadUsers(); await loadStats(); }
  catch (err: any) { showError(err.response?.data?.message || 'Error', 'Error'); }
  finally { deleting.value = false; }
};

const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
const formatTimeAgo = (date: string) => userManagementService.formatTimeAgo(date);
const getRoleConfig = (role: string) => userManagementService.getRoleConfig(role);
const getStatusConfig = (status: string) => userManagementService.getStatusConfig(status);

const handleUserCreated = () => { loadUsers(); loadStats(); };
const handleUserUpdated = () => { loadUsers(); loadStats(); };
const handleUserDeleted = () => { loadUsers(); loadStats(); };

onMounted(() => {
  loadUsers(); loadStats();
  eventBus.on('user:created', handleUserCreated); eventBus.on('user:updated', handleUserUpdated); eventBus.on('user:deleted', handleUserDeleted);
  eventBus.on('user:role:updated', handleUserUpdated); eventBus.on('user:status:updated', handleUserUpdated);
});
onUnmounted(() => {
  eventBus.off('user:created', handleUserCreated); eventBus.off('user:updated', handleUserUpdated); eventBus.off('user:deleted', handleUserDeleted);
  eventBus.off('user:role:updated', handleUserUpdated); eventBus.off('user:status:updated', handleUserUpdated);
});
</script>

<style scoped>
.rx-users {
  --surface: var(--admin-surface, #fff);
  --surface-alt: var(--admin-surface-elevated, #f8fafc);
  --txt: var(--admin-text-primary, #0f172a);
  --txt2: var(--admin-text-secondary, #475569);
  --txt3: var(--admin-text-muted, #94a3b8);
  --brd: var(--admin-border, #e2e8f0);
  --accent-color: var(--accent, #6366f1);
  --radius: 14px;
  --shadow: 0 1px 3px rgba(0, 0, 0, .04), 0 4px 12px rgba(0, 0, 0, .03);
  max-width: 1560px;
  margin: 0 auto;
  color: var(--txt);
  animation: rxFade .4s ease;
}

@keyframes rxFade {
  from {
    opacity: 0;
    transform: translateY(8px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.rx-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 0;
  margin-bottom: .5rem;
}

.rx-topbar__left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.rx-topbar__icon {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
  color: #fff;
  font-size: 1.2rem;
  box-shadow: 0 4px 14px rgba(139, 92, 246, .3);
}

.rx-topbar__title {
  font-size: 1.5rem;
  font-weight: 800;
  letter-spacing: -.02em;
  margin: 0;
  color: var(--txt);
}

.rx-topbar__sub {
  font-size: .875rem;
  color: var(--txt3);
  margin: .15rem 0 0;
}

.rx-btn {
  display: inline-flex;
  align-items: center;
  gap: .5rem;
  padding: .65rem 1.25rem;
  border-radius: 10px;
  font-weight: 600;
  font-size: .875rem;
  border: none;
  cursor: pointer;
  transition: all .2s;
  font-family: inherit;
}

.rx-btn--accent {
  background: linear-gradient(135deg, #6366f1, #818cf8);
  color: #fff;
  box-shadow: 0 2px 10px rgba(99, 102, 241, .25);
}

.rx-btn--accent:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(99, 102, 241, .35);
}

.rx-btn--ghost {
  background: var(--surface-alt);
  color: var(--txt2);
  border: 1px solid var(--brd);
}

.rx-btn--ghost:hover {
  border-color: var(--accent-color);
  color: var(--accent-color);
}

.rx-btn--danger {
  background: #ef4444;
  color: #fff;
}

.rx-btn--danger:hover {
  background: #dc2626;
}

.rx-btn:disabled {
  opacity: .5;
  cursor: not-allowed;
}

.rx-kpi-strip {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
  gap: 1rem;
  margin-bottom: 1.25rem;
}

.rx-kpi {
  background: var(--surface);
  border: 1px solid var(--brd);
  border-radius: var(--radius);
  padding: 1.15rem 1.25rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  position: relative;
  transition: all .25s;
  box-shadow: var(--shadow);
}

.rx-kpi:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, .06);
}

.rx-kpi__icon {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: hsl(var(--kpi-hue) 80% 95%);
  color: hsl(var(--kpi-hue) 70% 50%);
  font-size: 1rem;
  flex-shrink: 0;
}

.rx-kpi__body {
  display: flex;
  flex-direction: column;
}

.rx-kpi__val {
  font-size: 1.4rem;
  font-weight: 800;
  letter-spacing: -.02em;
  color: var(--txt);
}

.rx-kpi__label {
  font-size: .78rem;
  color: var(--txt3);
  font-weight: 500;
}

.rx-kpi__pct {
  position: absolute;
  top: .75rem;
  right: 1rem;
  font-size: .7rem;
  font-weight: 700;
  color: hsl(var(--kpi-hue) 70% 50%);
  background: hsl(var(--kpi-hue) 80% 95%);
  padding: .15rem .45rem;
  border-radius: 6px;
}

.rx-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: .75rem;
  margin-bottom: 1.25rem;
  align-items: center;
}

.rx-search {
  flex: 1;
  min-width: 260px;
  position: relative;
}

.rx-search__ico {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--txt3);
  font-size: .85rem;
}

.rx-search__input {
  width: 100%;
  padding: .7rem 2.5rem .7rem 2.75rem;
  border-radius: 10px;
  border: 1px solid var(--brd);
  background: var(--surface);
  color: var(--txt);
  font-size: .875rem;
  font-family: inherit;
}

.rx-search__input::placeholder {
  color: var(--txt3);
}

.rx-search__input:focus {
  outline: none;
  border-color: var(--accent-color);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, .08);
}

.rx-search__clear {
  position: absolute;
  right: .75rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: var(--txt3);
  cursor: pointer;
}

.rx-filters {
  display: flex;
  flex-wrap: wrap;
  gap: .5rem;
  align-items: center;
}

.rx-select {
  padding: .65rem 2rem .65rem .85rem;
  border-radius: 10px;
  border: 1px solid var(--brd);
  background: var(--surface);
  color: var(--txt2);
  font-size: .8rem;
  font-family: inherit;
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%2394a3b8' viewBox='0 0 16 16'%3E%3Cpath d='M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right .75rem center;
}

.rx-datagrid {
  background: var(--surface);
  border: 1px solid var(--brd);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  overflow: hidden;
}

.rx-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
  gap: .75rem;
}

.rx-state__icon {
  font-size: 2.5rem;
  color: var(--txt3);
}

.rx-state h3 {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--txt);
  margin: 0;
}

.rx-state p {
  font-size: .875rem;
  color: var(--txt3);
  margin: 0;
}

.rx-spinner {
  width: 36px;
  height: 36px;
  border: 3px solid var(--brd);
  border-top-color: var(--accent-color);
  border-radius: 50%;
  animation: rxSpin .7s linear infinite;
}

@keyframes rxSpin {
  to {
    transform: rotate(360deg);
  }
}

.rx-table-wrap {
  overflow-x: auto;
}

.rx-table {
  width: 100%;
  border-collapse: collapse;
}

.rx-table th {
  padding: .85rem 1rem;
  font-size: .75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: .04em;
  color: var(--txt3);
  background: var(--surface-alt);
  border-bottom: 1px solid var(--brd);
  text-align: left;
  white-space: nowrap;
}

.rx-th--sortable {
  cursor: pointer;
  user-select: none;
}

.rx-th--sortable:hover {
  color: var(--txt);
}

.rx-sort {
  font-size: .65rem;
  margin-left: .35rem;
  color: var(--txt3);
  opacity: .5;
}

.rx-sort.active {
  opacity: 1;
  color: var(--accent-color);
}

.rx-table td {
  padding: .85rem 1rem;
  font-size: .85rem;
  color: var(--txt);
  border-bottom: 1px solid var(--brd);
  vertical-align: middle;
}

.rx-row {
  transition: background .15s;
}

.rx-row:hover td {
  background: var(--surface-alt);
}

.rx-row:last-child td {
  border-bottom: none;
}

.rx-user-cell {
  display: flex;
  align-items: center;
  gap: .75rem;
}

.rx-avatar-wrap {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  overflow: hidden;
  flex-shrink: 0;
}

.rx-avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.rx-avatar {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: .75rem;
  font-weight: 700;
  background: #ede9fe;
  color: #7c3aed;
  flex-shrink: 0;
}

.rx-user-cell__info {
  display: flex;
  flex-direction: column;
}

.rx-user-cell__name {
  font-weight: 600;
  color: var(--txt);
  font-size: .85rem;
}

.rx-user-cell__sub {
  font-size: .72rem;
  color: var(--txt3);
}

.rx-badge {
  display: inline-flex;
  align-items: center;
  gap: .3rem;
  padding: .25rem .65rem;
  border-radius: 7px;
  font-size: .72rem;
  font-weight: 600;
}

.rx-date {
  font-size: .82rem;
  color: var(--txt2);
}

.rx-verif {
  display: inline-flex;
  align-items: center;
  gap: .3rem;
  padding: .25rem .6rem;
  border-radius: 7px;
  font-size: .72rem;
  font-weight: 600;
}

.rx-verif--yes {
  background: #ecfdf5;
  color: #059669;
}

.rx-verif--no {
  background: #fef3c7;
  color: #d97706;
}

.rx-actions {
  display: flex;
  gap: .35rem;
}

.rx-act {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--brd);
  background: var(--surface);
  color: var(--txt3);
  cursor: pointer;
  transition: all .2s;
  font-size: .75rem;
}

.rx-act:hover {
  color: #fff;
  transform: scale(1.08);
}

.rx-act--edit:hover {
  background: #6366f1;
  border-color: #6366f1;
}

.rx-act--approve:hover {
  background: #059669;
  border-color: #059669;
}

.rx-act--reject:hover {
  background: #f59e0b;
  border-color: #f59e0b;
}

.rx-act--delete:hover {
  background: #ef4444;
  border-color: #ef4444;
}

.rx-act:disabled {
  opacity: .4;
  cursor: not-allowed;
}

.rx-pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: .75rem;
  padding: 1rem;
  border-top: 1px solid var(--brd);
  flex-wrap: wrap;
}

.rx-pg-btn {
  display: inline-flex;
  align-items: center;
  gap: .35rem;
  padding: .5rem 1rem;
  border-radius: 8px;
  border: 1px solid var(--brd);
  background: var(--surface);
  color: var(--txt2);
  font-size: .8rem;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
}

.rx-pg-btn:hover:not(:disabled) {
  border-color: var(--accent-color);
  color: var(--accent-color);
}

.rx-pg-btn:disabled {
  opacity: .4;
  cursor: not-allowed;
}

.rx-pg-pages {
  display: flex;
  gap: .25rem;
}

.rx-pg-page {
  width: 34px;
  height: 34px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid transparent;
  background: transparent;
  color: var(--txt2);
  font-size: .8rem;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
}

.rx-pg-page.active {
  background: var(--accent-color);
  color: #fff;
}

.rx-pg-info {
  font-size: .78rem;
  color: var(--txt3);
}



/* ─── RESPONSIVE ─── */
@media (max-width: 1024px) {
  .rx-panels {
    grid-template-columns: 1fr;
  }

  .rx-detail-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .rx-topbar {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .rx-topbar__left,
  .rx-topbar__right {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }

  .rx-topbar__right .rx-btn {
    width: 100%;
    justify-content: center;
    margin-top: 0.5rem;
  }

  .rx-kpi-strip {
    grid-template-columns: 1fr 1fr;
  }

  .rx-toolbar {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }

  .rx-search {
    width: 100%;
  }

  .rx-search__input {
    width: 100%;
  }

  .rx-filters {
    width: 100%;
    flex-direction: column;
    align-items: stretch;
    gap: 0.5rem;
  }

  .rx-select {
    width: 100%;
  }

  .rx-filters .rx-btn {
    width: 100%;
    justify-content: center;
  }

  .rx-form__grid {
    grid-template-columns: 1fr;
  }

  .rx-modal__footer {
    flex-direction: column;
    gap: 0.5rem;
  }

  .rx-modal__footer .rx-btn {
    width: 100%;
    margin: 0;
  }
}

@media (max-width: 480px) {
  .rx-kpi-strip {
    grid-template-columns: 1fr;
  }

  .rx-topbar__title {
    font-size: 1.25rem;
  }

  .rx-topbar__icon {
    width: 40px;
    height: 40px;
    font-size: 1rem;
  }
}
</style>