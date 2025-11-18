import { useOrganization } from '@clerk/clerk-expo';

export const inviteUserToOrganization = async (
  organization: any,
  emailAddress: string,
  role: string = 'org:member',
) => {
  try {
    if (!organization) {
      throw new Error('No organization context found');
    }

    const invitation = await organization.inviteMember({
      emailAddress,
      role,
    });

    return {
      status: 'success',
      message: `Invitation sent to ${emailAddress}`,
      invitationId: invitation.id,
    };
  } catch (error) {
    console.error('Error sending invitation:', error);
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Failed to send invitation',
    };
  }
};

export const getOrganizationSlug = (orgName: string) => {
  return orgName.toLowerCase().replace(/\s+/g, '-');
};
