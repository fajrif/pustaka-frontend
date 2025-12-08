import React, { useState, useCallback, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/axios';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Upload, Trash2, X } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { validateImageFile } from '@/helpers/AssetHelper';
import Cropper from 'react-easy-crop';
import { getCroppedImg } from '@/utils/helpers/CropImageHelper';

const UserUploadPhotoDialog = ({ isOpen, onClose, userId, currentPhotoUrl, onFinish }) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const fileInputRef = useRef(null);
  const [imageSrc, setImageSrc] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      const validation = validateImageFile(file);
      if (validation.valid) {
        const reader = new FileReader();
        reader.addEventListener('load', () => {
          setImageSrc(reader.result);
        });
        reader.readAsDataURL(file);
      } else {
        toast({
          title: "Error",
          description: validation.error,
          variant: "destructive",
        });
        e.target.value = '';
      }
    }
  };

  const handleUpload = async () => {
    if (!imageSrc || !croppedAreaPixels) {
      toast({
        title: "Error",
        description: "Silakan pilih dan crop foto terlebih dahulu.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsUploading(true);

      // Get the cropped image as a blob
      const croppedImageBlob = await getCroppedImg(imageSrc, croppedAreaPixels);

      // Create FormData and append the cropped image
      const formData = new FormData();
      formData.append('file', croppedImageBlob, 'photo.jpg');

      // Upload to the server
      await api.post(`/upload/users/photo/${userId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      toast({
        title: "Success",
        description: "Photo berhasil diupload.",
        variant: "success",
      });

      queryClient.invalidateQueries(['userProfile']);
      onFinish();
      handleClose();
    } catch (error) {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Gagal mengupload photo.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await api.delete(`/upload/users/photo/${userId}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Photo berhasil dihapus.",
        variant: "success",
      });
      queryClient.invalidateQueries(['userProfile']);
      onFinish();
      handleClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Gagal menghapus photo.",
        variant: "destructive",
      });
    }
  });

  const handleDelete = () => {
    if (window.confirm('Apakah Anda yakin ingin menghapus photo?')) {
      deleteMutation.mutate();
    }
  };

  const handleClose = () => {
    setImageSrc(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Upload Photo Profil</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {!imageSrc ? (
            <div className="space-y-4">
              {/* File Input */}
              <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors">
                <Upload className="w-12 h-12 mx-auto text-slate-400 mb-4" />
                <p className="text-sm text-slate-600 mb-2">
                  Pilih foto untuk diupload
                </p>
                <p className="text-xs text-slate-500 mb-4">
                  JPEG atau PNG, maksimal 5MB
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="cursor-pointer"
                >
                  Pilih File
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Cropper */}
              <div className="relative w-full h-96 bg-slate-100 rounded-lg overflow-hidden">
                <Cropper
                  image={imageSrc}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  cropShape="round"
                  showGrid={false}
                  onCropChange={setCrop}
                  onCropComplete={onCropComplete}
                  onZoomChange={setZoom}
                />
              </div>

              {/* Zoom Control */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Zoom
                </label>
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.1}
                  value={zoom}
                  onChange={(e) => setZoom(parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>

              {/* Reset Button */}
              <Button
                type="button"
                variant="outline"
                onClick={() => setImageSrc(null)}
                className="w-full"
              >
                <X className="w-4 h-4 mr-2" />
                Pilih Foto Lain
              </Button>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          {currentPhotoUrl && !imageSrc && (
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {deleteMutation.isPending ? 'Menghapus...' : 'Hapus Photo Existing'}
            </Button>
          )}
          <Button type="button" variant="outline" onClick={handleClose}>
            Batal
          </Button>
          {imageSrc && (
            <Button
              type="button"
              onClick={handleUpload}
              disabled={isUploading}
              className="bg-green-600 hover:bg-green-700"
            >
              <Upload className="w-4 h-4 mr-2" />
              {isUploading ? 'Mengupload...' : 'Upload Photo'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UserUploadPhotoDialog;
