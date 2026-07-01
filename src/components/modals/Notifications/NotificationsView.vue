<template>
  <Transition name="modal-fade">
    <div v-show="open" class="overlay" @click.self="close">
      <div class="modal">
        
        <!-- Decorative particles -->
        <div class="particles">
          <div
            v-for="i in 8"
            :key="i"
            class="particle"
            :style="{ '--delay': i * 0.3 + 's' }"
          ></div>
        </div>

        <header class="header">
          <div class="header-content">
            <div class="title-wrapper">
              <div class="icon-badge">
                <font-awesome-icon icon="bell" class="bell-icon" />
                <span v-if="unreadCount > 0" class="badge-count">
                  {{ unreadCount }}
                </span>
              </div>
              <h2>{{ t("notifications.title") }}</h2>
            </div>

            <div class="header-actions">
              <button
                v-if="unreadCount > 0"
                class="mark-all-btn"
                @click="markAllAsRead"
              >
                <font-awesome-icon icon="check" />
                <span>{{ t("notifications.markAll") }}</span>
              </button>
              <button class="close-btn" @click="close">
                <font-awesome-icon icon="times" />
              </button>
            </div>
          </div>
        </header>

        <div class="content">
          <!-- Loading -->
          <div v-if="loading" class="loading">
            <div class="spinner-wrapper">
              <font-awesome-icon icon="spinner" class="spinner" spin />
            </div>
            <p>{{ t("notifications.loading") }}</p>
          </div>

          <!-- Notificaciones -->
          <div
            v-else-if="formattedNotifications.length > 0"
            class="notifications-list"
          >
            <TransitionGroup name="notification-list">
              <div
                v-for="(group, index) in formattedNotifications"
                :key="index"
                class="date-group"
              >
                <div class="date-label">
                  <span class="date-line"></span>
                  <span class="date-text">{{ group.date }}</span>
                  <span class="date-line"></span>
                </div>

                <TransitionGroup name="notification-item">
                  <div
                    v-for="notif in group.items"
                    :key="notif.id"
                    class="notif-item"
                    :class="{ unread: !notif.read }"
                    @click="handleNotificationClick(notif)"
                  >
                    <div
                      class="notif-glow"
                      :class="getNotificationType(notif.type)"
                    ></div>

                    <div
                      class="icon-wrapper"
                      :class="getNotificationType(notif.type)"
                    >
                      <font-awesome-icon
                        :icon="getNotificationIcon(notif.type)"
                        class="notif-icon"
                      />
                      <div class="icon-ripple"></div>
                    </div>

                    <div class="info">
                      <p class="text" v-html="notif.message"></p>
                      <div class="meta">
                        <font-awesome-icon icon="clock" class="time-icon" />
                        <span class="time">
                          {{ formatTime(notif.created_at) }}
                        </span>
                      </div>
                    </div>

                    <div class="actions">
                      <button
                        class="delete-btn"
                        @click.stop="deleteNotification(notif.id)"
                      >
                        <font-awesome-icon icon="times" />
                      </button>
                      <div v-if="!notif.read" class="unread-dot"></div>
                    </div>
                  </div>
                </TransitionGroup>
              </div>
            </TransitionGroup>
          </div>

          <!-- Vacío -->
          <div v-else class="empty">
            <div class="empty-icon-wrapper">
              <font-awesome-icon icon="bell" class="empty-icon" />
              <div class="empty-circle"></div>
            </div>
            <h3>{{ t("notifications.empty.title") }}</h3>
            <p>{{ t("notifications.empty.description") }}</p>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>


<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { notificationService } from "../../../services/notificationService";
import type { NotificationItem } from "../../../services/notificationService";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";

const { t, locale } = useI18n();

const props = defineProps<{
  open: boolean;
}>();

const emit = defineEmits(["close", "update"]);
const router = useRouter();

const notifications = ref<NotificationItem[]>([]);
const loading = ref(false);

const unreadCount = computed(() => 
  notifications.value.filter(n => !n.read).length
);

const formattedNotifications = computed(() => {
  const groups: Record<string, NotificationItem[]> = {};
  
  notifications.value.forEach((notif) => {
    const date = getDateLabel(notif.created_at);
    if (!groups[date]) groups[date] = [];
    groups[date].push(notif);
  });

  return Object.keys(groups).map((date) => ({
    date,
    items: groups[date],
  }));
});

watch(() => props.open, async (isOpen) => {
  if (isOpen) {
    await loadNotifications();
  }
});

const loadNotifications = async () => {
  loading.value = true;
  try {
    const result = await notificationService.getNotifications();
    notifications.value = result.notifications;
  } catch (error) {
    notifications.value = [];
  } finally {
    loading.value = false;
  }
};

const handleNotificationClick = async (notif: NotificationItem) => {
  if (!notif.read) {
    await markAsRead(notif.id);
  }

  const data = typeof notif.data === 'string' ? JSON.parse(notif.data) : (notif.data ?? {});

  switch (notif.type) {
    case "rental_request":
      close();
      emit("update", { action: "open_requests" });
      break;
    
    case "counter_proposal":
      close();
      emit("update", { action: "open_my_requests" });
      break;
    
    case "contract_sent":
      close();
      router.push("/contratos");
      break;
    
    case "visit_reminder":
      if (data.property_id) {
        close();
        router.push(`/propiedades/${data.property_id}`);
      }
      break;

    default:
      break;
  }
};

const markAsRead = async (notificationId: number) => {
  try {
    await notificationService.markAsRead(notificationId);
    const notif = notifications.value.find(n => n.id === notificationId);
    if (notif) {
      notif.read = true;
    }
    emit("update", { action: "refresh_count" });
  } catch (error) {
    console.error("Error marcando como leída:", error);
  }
};

const markAllAsRead = async () => {
  try {
    await notificationService.markAllAsRead();
    notifications.value.forEach(n => n.read = true);
    emit("update", { action: "refresh_count" });
  } catch (error) {
    console.error("Error marcando todas como leídas:", error);
  }
};

const deleteNotification = async (notificationId: number) => {
  try {
    await notificationService.deleteNotification(notificationId);
    notifications.value = notifications.value.filter(n => n.id !== notificationId);
    emit("update", { action: "refresh_count" });
  } catch (error) {
    console.error("Error eliminando notificación:", error);
  }
};

const getDateLabel = (dateStr: string) => {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return t("notifications.dates.today");
  } else if (date.toDateString() === yesterday.toDateString()) {
    return t("notifications.dates.yesterday");
  } else {
    return date.toLocaleDateString(locale.value, {
      day: "numeric",
      month: "long",
    });
  }
};


const formatTime = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleTimeString(locale.value, {
    hour: "2-digit",
    minute: "2-digit",
  });
};


const getNotificationType = (type: string) => {
  const typeMap: Record<string, string> = {
    rental_request: "primary",
    counter_proposal: "warning",
    contract_sent: "success",
    contract_accepted: "success",
    visit_reminder: "info",
    payment_reminder: "warning",
    system: "info",
  };
  return typeMap[type] || "info";
};

const getNotificationIcon = (type: string) => {
  const iconMap: Record<string, string> = {
    rental_request: "home",
    counter_proposal: "calendar",
    contract_sent: "file-alt",
    contract_accepted: "check-circle",
    visit_reminder: "clock",
    payment_reminder: "dollar-sign",
    system: "shield-alt",
  };
  return iconMap[type] || "bell";
};

const close = () => {
  emit("close");
};
</script>

<style scoped>
@import "../../../assets/css/components/NotificationsView.css"
</style>