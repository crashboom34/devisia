'use client';
/* eslint-disable react-hooks/exhaustive-deps */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, Trash2, Camera, Image as ImageIcon, Ruler, MessageSquare } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { ProjectRoom, RoomPhoto } from '@/lib/supabase';
import { toast } from 'sonner';

interface ProjectRoomsPhotosProps {
  projectId: string;
}

export default function ProjectRoomsPhotos({ projectId }: ProjectRoomsPhotosProps) {
  const [rooms, setRooms] = useState<ProjectRoom[]>([]);
  const [photos, setPhotos] = useState<Record<string, RoomPhoto[]>>({});
  const [loading, setLoading] = useState(true);
  const [showAddRoomDialog, setShowAddRoomDialog] = useState(false);
  const [showAddPhotoDialog, setShowAddPhotoDialog] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [showDeleteRoomDialog, setShowDeleteRoomDialog] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState<string | null>(null);
  const [showDeletePhotoDialog, setShowDeletePhotoDialog] = useState(false);
  const [photoToDelete, setPhotoToDelete] = useState<string | null>(null);

  const [newRoom, setNewRoom] = useState({ name: '', description: '' });
  const [newPhoto, setNewPhoto] = useState({
    imageUrl: '',
    comment: '',
    dimensionsText: '',
  });
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  useEffect(() => {
    loadRooms();
  }, [projectId]);

  const loadRooms = async () => {
    try {
      const { data: roomsData, error: roomsError } = await supabase
        .from('project_rooms')
        .select('*')
        .eq('project_id', projectId)
        .order('sort_order', { ascending: true });

      if (roomsError) throw roomsError;

      setRooms(roomsData || []);

      if (roomsData && roomsData.length > 0) {
        const roomIds = roomsData.map(r => r.id);
        const { data: photosData, error: photosError } = await supabase
          .from('room_photos')
          .select('*')
          .in('room_id', roomIds)
          .order('sort_order', { ascending: true });

        if (photosError) throw photosError;

        const photosByRoom: Record<string, RoomPhoto[]> = {};
        (photosData || []).forEach(photo => {
          if (!photosByRoom[photo.room_id]) {
            photosByRoom[photo.room_id] = [];
          }
          photosByRoom[photo.room_id].push(photo);
        });

        setPhotos(photosByRoom);
      }
    } catch (error: any) {
      console.error('Erreur chargement pièces:', error);
      toast.error('Erreur lors du chargement des pièces');
    } finally {
      setLoading(false);
    }
  };

  const handleAddRoom = async () => {
    if (!newRoom.name.trim()) {
      toast.error('Le nom de la pièce est requis');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('project_rooms')
        .insert({
          project_id: projectId,
          name: newRoom.name,
          description: newRoom.description,
          sort_order: rooms.length,
        })
        .select()
        .single();

      if (error) throw error;

      setRooms([...rooms, data]);
      setNewRoom({ name: '', description: '' });
      setShowAddRoomDialog(false);
      toast.success('Pièce ajoutée');
    } catch (error: any) {
      console.error('Erreur ajout pièce:', error);
      toast.error('Erreur lors de l\'ajout de la pièce');
    }
  };

  const handleDeleteRoom = async () => {
    if (!roomToDelete) return;

    try {
      const { error } = await supabase
        .from('project_rooms')
        .delete()
        .eq('id', roomToDelete);

      if (error) throw error;

      setRooms(rooms.filter(r => r.id !== roomToDelete));
      const newPhotos = { ...photos };
      delete newPhotos[roomToDelete];
      setPhotos(newPhotos);
      setShowDeleteRoomDialog(false);
      setRoomToDelete(null);
      toast.success('Pièce supprimée');
    } catch (error: any) {
      console.error('Erreur suppression pièce:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedRoom) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Veuillez sélectionner une image');
      return;
    }

    setUploadingPhoto(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${projectId}/${selectedRoom}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('project-photos')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('project-photos')
        .getPublicUrl(fileName);

      setNewPhoto(prev => ({ ...prev, imageUrl: publicUrl }));
      toast.success('Photo téléchargée');
    } catch (error: any) {
      console.error('Erreur upload photo:', error);
      toast.error('Erreur lors du téléchargement');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleAddPhoto = async () => {
    if (!selectedRoom || !newPhoto.imageUrl) {
      toast.error('Une image est requise');
      return;
    }

    try {
      const currentPhotos = photos[selectedRoom] || [];
      const { data, error } = await supabase
        .from('room_photos')
        .insert({
          room_id: selectedRoom,
          image_url: newPhoto.imageUrl,
          comment: newPhoto.comment,
          dimensions_text: newPhoto.dimensionsText,
          sort_order: currentPhotos.length,
        })
        .select()
        .single();

      if (error) throw error;

      setPhotos({
        ...photos,
        [selectedRoom]: [...currentPhotos, data],
      });

      setNewPhoto({ imageUrl: '', comment: '', dimensionsText: '' });
      setShowAddPhotoDialog(false);
      setSelectedRoom(null);
      toast.success('Photo ajoutée');
    } catch (error: any) {
      console.error('Erreur ajout photo:', error);
      toast.error('Erreur lors de l\'ajout de la photo');
    }
  };

  const handleDeletePhoto = async () => {
    if (!photoToDelete) return;

    try {
      const { error } = await supabase
        .from('room_photos')
        .delete()
        .eq('id', photoToDelete);

      if (error) throw error;

      const newPhotos = { ...photos };
      Object.keys(newPhotos).forEach(roomId => {
        newPhotos[roomId] = newPhotos[roomId].filter(p => p.id !== photoToDelete);
      });
      setPhotos(newPhotos);

      setShowDeletePhotoDialog(false);
      setPhotoToDelete(null);
      toast.success('Photo supprimée');
    } catch (error: any) {
      console.error('Erreur suppression photo:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  if (loading) {
    return <div className="text-center py-8">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Pièces et Photos</h2>
          <p className="text-sm text-gray-600">
            Gérez les pièces du chantier et ajoutez des photos avec dimensions
          </p>
        </div>
        <Button onClick={() => setShowAddRoomDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Ajouter une pièce
        </Button>
      </div>

      {rooms.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Camera className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600 mb-4">Aucune pièce ajoutée</p>
            <Button onClick={() => setShowAddRoomDialog(true)} variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Ajouter la première pièce
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {rooms.map(room => (
            <Card key={room.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{room.name}</CardTitle>
                    {room.description && (
                      <CardDescription>{room.description}</CardDescription>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => {
                        setSelectedRoom(room.id);
                        setShowAddPhotoDialog(true);
                      }}
                    >
                      <Camera className="h-4 w-4 mr-2" />
                      Ajouter photo
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => {
                        setRoomToDelete(room.id);
                        setShowDeleteRoomDialog(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {(!photos[room.id] || photos[room.id].length === 0) ? (
                  <div className="text-center py-8 text-gray-500">
                    <ImageIcon className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    Aucune photo pour cette pièce
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {photos[room.id].map(photo => (
                      <Card key={photo.id}>
                        <CardContent className="p-4">
                          <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden mb-3">
                            <img
                              src={photo.image_url}
                              alt={photo.comment || 'Photo'}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          {photo.dimensions_text && (
                            <div className="flex items-start gap-2 text-sm mb-2">
                              <Ruler className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                              <span className="text-gray-700">{photo.dimensions_text}</span>
                            </div>
                          )}
                          {photo.comment && (
                            <div className="flex items-start gap-2 text-sm mb-2">
                              <MessageSquare className="h-4 w-4 text-gray-600 mt-0.5 flex-shrink-0" />
                              <span className="text-gray-600">{photo.comment}</span>
                            </div>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full mt-2"
                            onClick={() => {
                              setPhotoToDelete(photo.id);
                              setShowDeletePhotoDialog(true);
                            }}
                          >
                            <Trash2 className="h-3 w-3 mr-2" />
                            Supprimer
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog Ajout Pièce */}
      <Dialog open={showAddRoomDialog} onOpenChange={setShowAddRoomDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter une pièce / zone</DialogTitle>
            <DialogDescription>
              Ajoutez une pièce ou zone du chantier (salon, chambre, façade, etc.)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="room-name">Nom de la pièce *</Label>
              <Input
                id="room-name"
                placeholder="Ex: Salon, Chambre 1, Façade sud..."
                value={newRoom.name}
                onChange={(e) => setNewRoom({ ...newRoom, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="room-desc">Description (optionnel)</Label>
              <Textarea
                id="room-desc"
                placeholder="Détails sur cette pièce..."
                value={newRoom.description}
                onChange={(e) => setNewRoom({ ...newRoom, description: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddRoomDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleAddRoom}>Ajouter</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Ajout Photo */}
      <Dialog open={showAddPhotoDialog} onOpenChange={setShowAddPhotoDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter une photo</DialogTitle>
            <DialogDescription>
              Ajoutez une photo avec commentaire et dimensions optionnels
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="photo-upload">Photo *</Label>
              <Input
                id="photo-upload"
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                disabled={uploadingPhoto}
              />
              {uploadingPhoto && <p className="text-sm text-gray-500 mt-1">Téléchargement...</p>}
              {newPhoto.imageUrl && (
                <div className="mt-2 relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
                  <img
                    src={newPhoto.imageUrl}
                    alt="Aperçu"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>
            <div>
              <Label htmlFor="photo-dimensions">Dimensions (optionnel)</Label>
              <Input
                id="photo-dimensions"
                placeholder="Ex: 3,50m x 4,20m, HSP 2,50m"
                value={newPhoto.dimensionsText}
                onChange={(e) => setNewPhoto({ ...newPhoto, dimensionsText: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="photo-comment">Commentaire (optionnel)</Label>
              <Textarea
                id="photo-comment"
                placeholder="Ex: Mur fissuré côté fenêtre"
                value={newPhoto.comment}
                onChange={(e) => setNewPhoto({ ...newPhoto, comment: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowAddPhotoDialog(false);
              setNewPhoto({ imageUrl: '', comment: '', dimensionsText: '' });
              setSelectedRoom(null);
            }}>
              Annuler
            </Button>
            <Button onClick={handleAddPhoto} disabled={!newPhoto.imageUrl}>
              Ajouter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Suppression Pièce */}
      <AlertDialog open={showDeleteRoomDialog} onOpenChange={setShowDeleteRoomDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette pièce ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action supprimera la pièce et toutes ses photos. Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteRoom}>Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog Suppression Photo */}
      <AlertDialog open={showDeletePhotoDialog} onOpenChange={setShowDeletePhotoDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette photo ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePhoto}>Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
