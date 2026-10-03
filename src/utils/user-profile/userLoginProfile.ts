import Cookies from 'js-cookie'

import type { UserProps } from '../types/UserType'
import type { MenuI } from '@/types/security-center-system/MenuTypes'
import { safeJsonParse } from '../formatting-checking-value/safeJsonParse'

function getUserData(): UserProps {
  // console.log(Cookies.get('userData'));

  try {
    const jsonValue = safeJsonParse<UserProps>(Cookies.get('userData') || '') || {
      EMPLOYEE_CODE: '',
      FIRST_NAME: '',
      LAST_NAME: '',
      SECTION_NAME: '',
      USER_GROUP_ID: '',
      USER_GROUP_NAME: '',
      USER_ID: '',
      POSITION_NAME: '',
      JOB_GRADE: '',
      EMAIL: '',
      DEPARTMENT_NAME: '',
      USER_NAME: ''
    }
    return jsonValue
  } catch (e) {
    console.log(e)

    return {
      EMPLOYEE_CODE: '',
      FIRST_NAME: '',
      LAST_NAME: '',
      SECTION_NAME: '',
      USER_GROUP_ID: '',
      USER_GROUP_NAME: '',
      USER_ID: '',
      POSITION_NAME: '',
      JOB_GRADE: '',
      EMAIL: '',
      DEPARTMENT_NAME: '',
      USER_NAME: ''
    }
  }
}

function isUserLoggedIn(): boolean {
  if (getUserData().USER_ID !== '') {
    return true
  } else {
    return false
  }
}

// function setUserDataInCookies(user: UserProps | '', expires: number = 1): boolean {
//   try {
//     Cookies.set('userData', JSON.stringify(user), { expires })

//     return true
//   } catch (error) {
//     return false
//   }
// }

function deleteUserDataInCookies(): boolean {
  try {
    Cookies.remove('userData')
    return true
  } catch (error) {
    return false
  }
}

// function setMenuInCookies(menu: MenuI[] | undefined): boolean {
//   // console.log(menu, JSON.stringify(menu));

//   if (typeof menu === 'undefined') {
//     Cookies.set('menu', '', { expires: 1 })

//     return false
//   } else {
//     Cookies.set('menu', JSON.stringify(menu), { expires: 1 })

//     return true
//   }
// }

// function getMenuInCookies(): MenuI[] {
//   let result: MenuI[] = []

//   if (Cookies.get('menu')) {
//     result = JSON.parse(Cookies.get('menu') || '')
//   } else {
//     result = []
//   }

//   return result
// }

export {
  getUserData,
  // setUserDataInCookies,
  // setMenuInCookies,
  // getMenuInCookies,
  isUserLoggedIn,
  deleteUserDataInCookies
}
