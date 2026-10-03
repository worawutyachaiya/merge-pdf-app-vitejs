import UserGroupService from '@/services/security-center-system/UserGroupServices'
import type { UserGroupInterface } from '@/types/security-center-system/UserGroupTypes'

interface UserGroupOption extends UserGroupInterface {}

const fetchUserGroup = (userGroupName: string, userName: string) =>
  new Promise<UserGroupOption[]>(resolve => {
    const param = {
      USER_GROUP_NAME: `${userGroupName}`,
      USER_NAME: `${userName}`
    }
    // console.log(param);

    UserGroupService.getUserGroupByUsernameAndLikeUserGroupName(param)
      .then(responseJson => {
        resolve(responseJson.data.ResultOnDb)
      })
      .catch(error => console.log(error))
  })
const fetchUserGroupFilterApp = (userName: string, applicationID: string) =>
  new Promise<UserGroupOption[]>(resolve => {
    const param = {
      USER_NAME: `${userName}`,
      APPLICATION_ID: `${applicationID}`
    }
    UserGroupService.getUserGroupByUsernameAndApplication(param)
      .then(responseJson => {
        resolve(responseJson.data.ResultOnDb)
      })
      .catch(error => console.log(error))
  })
export { fetchUserGroup, fetchUserGroupFilterApp }
