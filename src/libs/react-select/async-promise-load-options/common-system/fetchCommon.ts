import UserProfileSettingProgramServices from '@/services/common-system/UserProfileSettingProgramServices'
import type { UserProfileSettingApplicationI } from '@/types/common-system/UserProfileSettingApplication'

interface UserProfileSettingApplicationOption extends UserProfileSettingApplicationI {}

const fetchUserGroupByUserIdAndApplicationId = (userId: number, applicationId: number) =>
  new Promise<UserProfileSettingApplicationOption[]>(resolve => {
    const param = {
      USER_ID: `${userId}`,
      APPLICATION_ID: `${applicationId}`
    }
    UserProfileSettingProgramServices.getUserGroupByUserIdAndApplicationId(param)
      .then(responseJson => {
        resolve(responseJson.data.ResultOnDb)
      })
      .catch(error => console.log(error))
  })

export { fetchUserGroupByUserIdAndApplicationId }
