import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { authAPI } from '@/api/endpoints';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { User, Mail, Shield, Pencil, UserCircle, Camera } from 'lucide-react';
import { getRoleColor } from '@/utils/helpers/UserHelper';
import { getAssetUrl } from '@/helpers/AssetHelper';
import EditProfileDialog from '@/components/dialogs/EditProfileDialog';
import UserUploadPhotoDialog from '@/components/dialogs/UserUploadPhotoDialog';

const UserProfile = () => {
  const queryClient = useQueryClient();
  const [showDialog, setShowDialog] = useState(false);
  const [showPhotoDialog, setShowPhotoDialog] = useState(false);

  const { data: profileData, isLoading } = useQuery({
    queryKey: ['userProfile'],
    queryFn: async () => {
      const response = await authAPI.getMe();
      return response.data;
    },
  });

  const handleEditClick = () => {
    setShowDialog(true);
  };

  const handleFinishEdit = (passwordChanged) => {
    if (!passwordChanged) {
      // Only refresh profile data if password was not changed
      // (if password was changed, user will be logged out)
      queryClient.invalidateQueries(['userProfile']);
    }
    setShowDialog(false);
  };

  const handlePhotoUploadFinish = () => {
    queryClient.invalidateQueries(['userProfile']);
    setShowPhotoDialog(false);
  };

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Profil Pengguna</h1>
            <p className="text-slate-500 font-normal mt-1">Kelola informasi profil Anda</p>
          </div>
        </div>

        {/* Info Card */}
        <Card className="border-none shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                <UserCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">Informasi Profil</h3>
                <p className="text-sm text-slate-700 mb-3">
                  Halaman ini menampilkan informasi profil Anda. Anda dapat mengubah nama dan password Anda.
                </p>
                <div className="space-y-1 text-sm text-slate-600">
                  <p>• Nama lengkap dapat diubah kapan saja</p>
                  <p>• Setelah mengubah password, Anda akan otomatis keluar dan perlu login kembali</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profile Information Card */}
        {isLoading ? (
          <Card className="border-none shadow-lg">
            <CardContent className="pt-6">
              <div className="text-center py-8">Memuat data profil...</div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-none shadow-lg">
            <CardHeader className="border-b border-slate-100">
              <div className="flex justify-between items-center">
                <CardTitle className="text-xl">Informasi Akun</CardTitle>
                <Button
                  onClick={handleEditClick}
                  className="bg-blue-600 hover:bg-blue-700"
                  size="sm"
                >
                  <Pencil className="w-4 h-4 mr-2" />
                  Edit Profil
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-6">
                {/* Avatar Section */}
                <div className="flex items-center gap-4 pb-6 border-b border-slate-100">
                  <div
                    className="relative group cursor-pointer"
                    onClick={() => setShowPhotoDialog(true)}
                  >
                    {profileData?.photo_url ? (
                      <img
                        src={getAssetUrl(profileData.photo_url)}
                        alt="Profile Photo"
                        className="w-20 h-20 rounded-full object-cover border-2 border-slate-200"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div
                      className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center"
                      style={{ display: profileData?.photo_url ? 'none' : 'flex' }}
                    >
                      <span className="text-white font-bold text-2xl">
                        {profileData?.full_name?.charAt(0) || 'U'}
                      </span>
                    </div>
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Camera className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-slate-900">
                      {profileData?.full_name || 'User'}
                    </h3>
                    <p className="text-slate-500 text-sm mt-1">
                      {profileData?.role === "admin" ? (
                        'Administrator memiliki akses penuh ke semua fitur sistem.'
                      ) : profileData?.role === "user" ? (
                        'User memiliki akses terbatas sesuai dengan peran yang diberikan.'
                      ) : (
                        'Operator memiliki akses untuk mengelola operasi harian sistem.'
                      )}
                    </p>
                  </div>
                </div>

                {/* Profile Details */}
                <div className="grid gap-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-slate-500">Nama Lengkap</p>
                      <p className="text-base font-medium text-slate-900">
                        {profileData?.full_name || '-'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Mail className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-slate-500">Email</p>
                      <p className="text-base font-medium text-slate-900">
                        {profileData?.email || '-'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className={getRoleColor(profileData.role) + " w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"}>
                      <Shield className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <Badge
                        variant="outline"
                        className={getRoleColor(profileData.role)}
                      >
                        {profileData?.role}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Edit Profile Dialog */}
      <EditProfileDialog
        isOpen={showDialog}
        onClose={() => setShowDialog(false)}
        user={profileData}
        onFinish={handleFinishEdit}
      />

      {/* Upload Photo Dialog */}
      <UserUploadPhotoDialog
        isOpen={showPhotoDialog}
        onClose={() => setShowPhotoDialog(false)}
        userId={profileData?.id}
        currentPhotoUrl={profileData?.photo_url}
        onFinish={handlePhotoUploadFinish}
      />
    </div>
  );
};

export default UserProfile;
