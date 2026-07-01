// src/main.ts
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { createHead } from '@unhead/vue/client';
import App from './App.vue';
import router from './router';
import { i18n } from './i18n';
import logger from '@/utils/logger';
import '@/plugins/echo'

// ── FontAwesome (tree-shakeable individual icon imports) ──────────────────
import { library } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

// Solid icons
import {
  faAdjust, faAlignLeft, faArrowLeft, faArrowRight, faBan, faBath, faBed, faBell,
  faBolt, faBuilding, faBuildingColumns, faCar, faCalendar, faCalendarAlt,
  faCalendarCheck, faCalendarTimes,
  faCamera, faCheck, faCheckCircle, faCheckDouble, faCheckSquare, faChartArea,
  faChevronDown, faChevronLeft, faChevronRight, faChevronUp, faCircle, faCity,
  faClipboardCheck, faClipboardList, faClock, faCloudUploadAlt, faCog, faCoins,
  faComments, faCreditCard, faCrosshairs, faCrown,
  faDollarSign, faDownload, faEdit, faEllipsisV, faEnvelope,
  faExclamationTriangle,
  faEye, faFileAlt, faFlag, faHashtag, faHandshake, faHeading, faHeart as faHeartSolid,
  faHelmetSafety, faHome,
  faImage, faImages, faInfoCircle,
  faLightbulb, faLink, faListCheck, faLocationDot, faLock, faLockOpen,
  faMap, faMapMarkerAlt, faMapPin, faBars, faBellSlash, faMoon, faMousePointer,
  faPalette, faPaw, faPen, faPeopleGroup, faPhone, faList,
  faPlus, faPlusCircle, faRedo, faRoad, faRobot, faRuler, faRulerCombined,
  faSave, faSearch, faSearchLocation,
  faShareAlt, faShieldAlt, faSignInAlt, faSignOutAlt, faSlidersH, faSort,
  faSortDown, faSortUp, faStar, faStickyNote, faSun, faSpinner, faStore, faSyncAlt,
  faThList, faTicket,
  faTimes, faTimesCircle, faToggleOn, faToolbox, faTrash, faTrashAlt, faTrashCan,
  faTree, faUpload, faUser, faUserCheck, faUserClock, faUserLock, faUsers,
  faUserTie, faUserSecret, faWallet, faWrench,
  faMoneyBillWave, faChartLine, faChartPie, faReceipt, faTools, faExclamationCircle,
  faHammer, faArrowUp, faArrowDown, faMinus, faFileContract, faChartBar,
  faFire, faArrowTrendUp, faArrowTrendDown, faUserShield, faFolderOpen, faQuestion,
  faInbox, faFileExport, faHandsClapping, faUserPlus, faUserEdit, faUserMinus,
  faUserCog, faExchangeAlt, faFileSignature, faThumbtack, faRocket, faLeaf,
  faDroplet,
  faWifi,
  faMapLocationDot,
  faTv,
  faDumbbell,
  faSquareParking,
  faFireBurner,
  faElevator,
  faPersonSwimming,
  faJugDetergent,
  faExpand,
  faBrain,
  faHandSparkles,
  faHeartbeat,
  faMicrochip,
  faPlay,
  faPause,
  faPlayCircle,
  faCodeBranch,
  faCalendarDay,
  faTh,
  faAward,
  faGlobeAmericas,
  faHistory,
  faFilter,
  faComment,
  faTerminal
} from '@fortawesome/free-solid-svg-icons';

// Regular icons
import {
  faCircle as faCircleRegular,
  faHeart as faHeartRegular,
} from '@fortawesome/free-regular-svg-icons';

// Brand icons
import {
  faFacebookF, faInstagram, faLinkedinIn, faTwitter,
} from '@fortawesome/free-brands-svg-icons';

library.add(
  // Solid
  faAdjust, faAlignLeft, faArrowLeft, faArrowRight, faBan, faBars, faBath, faBed, faBell, faBellSlash,
  faBolt, faBuilding, faBuildingColumns, faCar, faCalendar, faCalendarAlt,
  faCalendarCheck, faCalendarTimes,
  faCamera, faCheck, faCheckCircle, faCheckDouble, faCheckSquare, faChartArea,
  faChevronDown, faChevronLeft, faChevronRight, faChevronUp, faCircle, faCity,
  faClipboardCheck, faClipboardList, faClock, faCloudUploadAlt, faCog, faCoins,
  faComments, faCreditCard, faCrosshairs, faCrown, faDollarSign, faDownload, faEdit,
  faEllipsisV, faEnvelope,
  faExclamationTriangle, faEye, faFileAlt, faFlag, faHandshake, faHashtag, faHeading,
  faHeartSolid, faHelmetSafety, faHome, faImage, faImages, faInfoCircle,
  faLightbulb, faLink, faListCheck, faLocationDot, faLock, faLockOpen,
  faMap, faMapMarkerAlt, faMapPin, faMoon, faMousePointer, faPalette, faPaw, faPen,
  faPeopleGroup, faPhone, faPlus, faPlusCircle, faRedo, faRoad, faRobot, faRuler,
  faRulerCombined, faSave, faSearch, faSearchLocation, faShareAlt, faShieldAlt,
  faList,
  faSignInAlt, faSignOutAlt, faSlidersH, faSort, faSortDown, faSortUp, faStar,
  faStickyNote, faSun, faSpinner, faStore, faSyncAlt,
  faThList, faTicket, faTimes, faTimesCircle, faToggleOn, faToolbox,
  faTrash, faTrashAlt, faTrashCan, faTree, faUpload, faUser, faUserCheck, faUserClock,
  faUserLock, faUsers, faUserTie, faUserSecret, faWallet, faWrench,
  faMoneyBillWave, faChartLine, faChartPie, faReceipt, faTools, faExclamationCircle,
  faHammer, faArrowUp, faArrowDown, faMinus, faFileContract, faChartBar,
  faFire, faArrowTrendUp, faArrowTrendDown, faUserShield, faFolderOpen, faQuestion,
  faInbox, faFileExport, faHandsClapping, faUserPlus, faUserEdit, faUserMinus,
  faUserCog, faExchangeAlt, faFileSignature, faThumbtack, faDroplet, faWifi, faRocket, faLeaf,
  faMapLocationDot, faTv, faDumbbell, faSquareParking, faFireBurner, faElevator,
  faPersonSwimming, faJugDetergent, faToggleOn, faExpand,
  faBrain, faHandSparkles, faHeartbeat, faMicrochip, faPlay, faPause, faPlayCircle,
  faCodeBranch, faCalendarDay, faTh, faAward, faGlobeAmericas, faHistory, faFilter, faComment, faTerminal,

  // Regular
  faCircleRegular, faHeartRegular,
  // Brand
  faFacebookF, faInstagram, faLinkedinIn, faTwitter,
);

// ── Application bootstrap ─────────────────────────────────────────────────
const app = createApp(App);
const head = createHead();

app.use(head);
app.use(i18n);
app.use(createPinia());
app.use(router);
app.component('font-awesome-icon', FontAwesomeIcon);
app.mount('#app');

// ── Adaptive favicon (dark/light mode) ───────────────────────────────────
function setFavicon() {
  const link = document.querySelector<HTMLLinkElement>("link[rel='icon']");
  if (!link) return;
  const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  link.href = isDark ? '/favicon-light.png' : '/favicon-dark.png';
}

setFavicon();
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', setFavicon);

// ── DEV navigation tracing ───────────────────────────────────────────────
router.afterEach((to, from) => {
  logger.log(`Navigation: ${from.path} → ${to.path}`);
});