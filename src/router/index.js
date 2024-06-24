import { createRouter, createWebHistory } from 'vue-router'
import AuthView from '../views/user/AuthView.vue'
import AdminView from '../views/admin/AdminDashboard.vue'
import StudentView from '../views/student/StudentMain.vue'
import TeacherView from '../views/teacher/TeacherMain.vue'
import CalendarView from '../views/calendar/CalendarSheet.vue'
import ChatsView from '../views/chat/ChatList.vue'
import UserProfile from '../views/user/UserProfile.vue'
import UserList from '../views/user/UserList.vue'
import ChatSession from '../views/chat/ChatSession.vue'
import EventManage from '../views/event/EventManage.vue'
import NotificationView from '../views/notification/NotificationList.vue'
import { checkAuth } from './auth'

const authGuard = (accountTypes) => async (to, from, next) => {
  const user = await checkAuth()
  if (user && (!accountTypes || accountTypes.includes(user.accountType))) {
    next()
  } else {
    next('/')
  }
}

const routes = [
  {
    path: '/',
    name: 'Home',
    component: AuthView,
    beforeEnter: async (to, from, next) => {
      const user = await checkAuth()
      if (user) {
        if (user.accountType === 'admin') {
          next('/admin')
        } else if (user.accountType === 'teacher') {
          next('/teacher')
        } else if (user.accountType === 'student') {
          next('/student')
        }
      } else {
        next()
      }
    }
  },
  {
    path: '/auth',
    name: 'Auth',
    component: AuthView
  },
  {
    path: '/student',
    name: 'StudentMain',
    component: StudentView,
    beforeEnter: authGuard(['student'])
  },
  {
    path: '/teacher',
    name: 'TeacherMain',
    component: TeacherView,
    beforeEnter: authGuard(['teacher'])
  },
  {
    path: '/student/calendar',
    name: 'StudentCalendar',
    component: CalendarView,
    beforeEnter: authGuard(['student'])
  },
  {
    path: '/chats',
    name: 'Chats',
    component: ChatsView,
    beforeEnter: authGuard(['student', 'teacher'])
  },
  {
    path: '/chats/sid=:id',
    name: 'ChatSession',
    component: ChatSession,
    beforeEnter: authGuard(['student', 'teacher'])
  },
  {
    path: '/teacher/calendar',
    name: 'TeacherCalendar',
    component: CalendarView,
    beforeEnter: authGuard(['teacher'])
  },
  {
    path: '/teacher/manage',
    name: 'TeacherEventsManage',
    component: EventManage,
    beforeEnter: authGuard(['teacher'])
  },
  {
    path: '/admin',
    name: 'Admin',
    component: AdminView,
    beforeEnter: authGuard(['admin']),
    children: [
      { path: 'users', component: AdminView },
      { path: 'profiles', component: AdminView },
      { path: 'sections', component: AdminView },
      { path: 'consultations', component: AdminView },
      { path: 'consultationRegistrations', component: AdminView },
      { path: 'chatSessions', component: AdminView },
      { path: 'chatMessages', component: AdminView },
      { path: 'notifications', component: AdminView }
    ]
  },
  {
    path: '/users/id/:id',
    name: 'UserProfile',
    component: UserProfile,
    beforeEnter: authGuard()
  },
  {
    path: '/users/list',
    name: 'UserList',
    component: UserList,
    beforeEnter: authGuard()
  },
  {
    path: '/notifications',
    name: 'Notifications',
    component: NotificationView,
    beforeEnter: authGuard()
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

export default router
