import { fetchUserGroupByUserIdAndApplicationId } from '@/libs/react-select/async-promise-load-options/common-system/fetchCommon'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type UserGroupState = {
  selectedGroup: string
  loading: boolean
  fetchDefaultGroup: (employeeCode: string) => Promise<void>
  setSelectedGroup: (group: string) => void
}

export const useUserGroupStore = create<UserGroupState>()(
  persist(
    set => ({
      selectedGroup: 'Merge Menu',
      loading: false,

      setSelectedGroup: group => set({ selectedGroup: group }),

      fetchDefaultGroup: async (userId: any) => {
        try {
          set({ loading: true })

          const res = await fetchUserGroupByUserIdAndApplicationId(userId, import.meta.env.VITE_APPLICATION_ID)

          const apiGroup = res?.[0]?.USER_PROFILE_SETTING_APPLICATION_DATA?.userGroupData?.userGroup

          set({
            selectedGroup: apiGroup ?? 'Merge Menu'
          })
        } catch (error) {
          set({ selectedGroup: 'Merge Menu' })
        } finally {
          set({ loading: false })
        }
      }
    }),
    {
      name: 'user-group-storage',
      partialize: state => ({
        selectedGroup: state.selectedGroup
      })
    }
  )
)
