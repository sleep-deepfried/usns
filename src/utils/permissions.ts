import { UserRole } from '../types/auth';

export interface RolePermissions {
  // Notification permissions
  canSendNotification: boolean;
  canViewNotifications: boolean;
  canMarkAsRead: boolean;
  
  // Feedback permissions
  canSendFeedback: boolean;
  canViewFeedback: boolean;
  canReplyToFeedback: boolean;
  canDeleteFeedback: boolean;
  
  // User management permissions
  canViewUserList: boolean;
  canPromoteToTeacher: boolean;
  canVerifyStudent: boolean;
  canUnverifyStudent: boolean;
  
  // Dashboard access
  canAccessDashboard: boolean;
}

/**
 * Get permissions for a given user role
 * 
 * ADMINISTRATOR:
 * - Can view all users and promote any user to Teacher
 * - Can send notifications to entire school
 * - Can view all feedback, reply, and remove inappropriate comments
 * - Can also verify students (Teacher duties)
 * 
 * TEACHER:
 * - Can send notifications (name auto-tagged)
 * - Can verify students (promote to Verified_Student)
 * - Can view and reply to feedback
 * - Can view home feed
 * 
 * VERIFIED_STUDENT:
 * - Can view announcements
 * - Can mark notifications as read
 * - Can send feedback on announcements
 * 
 * STUDENT (Unverified):
 * - Can view announcements
 * - Can mark notifications as read
 * - CANNOT send feedback (locked)
 */
export function getPermissions(role: UserRole): RolePermissions {
  switch (role) {
    case 'Administrator':
      return {
        canSendNotification: true,
        canViewNotifications: true,
        canMarkAsRead: true,
        canSendFeedback: true,
        canViewFeedback: true,
        canReplyToFeedback: true,
        canDeleteFeedback: true,
        canViewUserList: true,
        canPromoteToTeacher: true,
        canVerifyStudent: true, // Admin can also do Teacher duties
        canUnverifyStudent: true,
        canAccessDashboard: true,
      };
    case 'Teacher':
      return {
        canSendNotification: true,
        canViewNotifications: true,
        canMarkAsRead: true,
        canSendFeedback: true,
        canViewFeedback: true,
        canReplyToFeedback: true,
        canDeleteFeedback: false,
        canViewUserList: true, // To see students for verification
        canPromoteToTeacher: false,
        canVerifyStudent: true,
        canUnverifyStudent: true,
        canAccessDashboard: true,
      };
    case 'Verified_Student':
      return {
        canSendNotification: false,
        canViewNotifications: true,
        canMarkAsRead: true,
        canSendFeedback: true, // Active feature
        canViewFeedback: false,
        canReplyToFeedback: false,
        canDeleteFeedback: false,
        canViewUserList: false,
        canPromoteToTeacher: false,
        canVerifyStudent: false,
        canUnverifyStudent: false,
        canAccessDashboard: false,
      };
    case 'Student':
      return {
        canSendNotification: false,
        canViewNotifications: true,
        canMarkAsRead: true,
        canSendFeedback: false, // LOCKED - cannot send feedback
        canViewFeedback: false,
        canReplyToFeedback: false,
        canDeleteFeedback: false,
        canViewUserList: false,
        canPromoteToTeacher: false,
        canVerifyStudent: false,
        canUnverifyStudent: false,
        canAccessDashboard: false,
      };
    default:
      // Default to most restrictive permissions
      return {
        canSendNotification: false,
        canViewNotifications: false,
        canMarkAsRead: false,
        canSendFeedback: false,
        canViewFeedback: false,
        canReplyToFeedback: false,
        canDeleteFeedback: false,
        canViewUserList: false,
        canPromoteToTeacher: false,
        canVerifyStudent: false,
        canUnverifyStudent: false,
        canAccessDashboard: false,
      };
  }
}

/**
 * Check if a user with currentRole can promote another user to targetRole
 * @param currentRole - The role of the user performing the action
 * @param targetRole - The role to promote to
 * @returns true if promotion is allowed, false otherwise
 */
export function canPromoteUser(currentRole: UserRole, targetRole: UserRole): boolean {
  // Only Administrators can promote to Teacher
  if (targetRole === 'Teacher') {
    return currentRole === 'Administrator';
  }
  
  // Only Teachers can verify students (promote Student to Verified_Student)
  if (targetRole === 'Verified_Student') {
    return currentRole === 'Teacher' || currentRole === 'Administrator';
  }
  
  // No one can promote to Administrator or demote to Student
  return false;
}
