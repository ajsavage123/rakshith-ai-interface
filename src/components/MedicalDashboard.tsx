import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Pill, Heart, AlertCircle, Users, Clock, TrendingUp, Download, Share2, Edit2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { storageService } from '@/lib/storage';

interface MedicalHistory { allergies: string[]; medications: string[]; conditions: string[]; vaccinations: string[]; }

const MedicalDashboard: React.FC = () => {
  const { user } = useAuth();
  const [medicalData, setMedicalData] = useState<MedicalHistory>({ allergies: [], medications: [], conditions: [], vaccinations: [] });
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => { loadMedicalData(); }, [user]);

  const loadMedicalData = async () => {
    try {
      if (user?.uid) {
        const history = await storageService.getMedicalHistory(user.uid);
        if (history) {
          setMedicalData({
            allergies: (history.allergies || '').split(',').filter(Boolean),
            medications: (history.medications || '').split(',').filter(Boolean),
            conditions: (history.conditions || '').split(',').filter(Boolean),
            vaccinations: (history.vaccinations || '').split(',').filter(Boolean),
          });
        }
        const savedProfile = localStorage.getItem('userProfile');
        if (savedProfile) setUserProfile(JSON.parse(savedProfile));
      }
    } catch (error) { console.error('Error loading medical data:', error); } finally { setLoading(false); }
  };

  if (loading) return <div className="text-center py-8 text-muted-foreground">Loading medical data...</div>;

  const isEmpty = !medicalData.allergies.length && !medicalData.medications.length && !medicalData.conditions.length && !medicalData.vaccinations.length;

  return (
    <div className="w-full space-y-8">
      <Card className="glass-card border-white/10">
        <CardHeader className="pb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-destructive/30 to-destructive/10 rounded-xl flex items-center justify-center border border-destructive/20">
              <Heart className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <CardTitle className="text-xl text-foreground">Medical Profile</CardTitle>
              <CardDescription className="text-muted-foreground/70">Your health overview</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-5">
          {[{ label: 'Allergies', count: medicalData.allergies.length, color: 'text-primary', bgColor: 'from-primary/25 to-primary/10', borderColor: 'border-primary/20' },
            { label: 'Medications', count: medicalData.medications.length, color: 'text-yellow-400', bgColor: 'from-yellow-500/25 to-yellow-500/10', borderColor: 'border-yellow-500/20' },
            { label: 'Conditions', count: medicalData.conditions.length, color: 'text-destructive', bgColor: 'from-destructive/25 to-destructive/10', borderColor: 'border-destructive/20' },
            { label: 'Vaccinations', count: medicalData.vaccinations.length, color: 'text-success', bgColor: 'from-success/25 to-success/10', borderColor: 'border-success/20' }
          ].map(item => (
            <div key={item.label} className={`glass-card bg-gradient-to-br ${item.bgColor} border ${item.borderColor} p-5 rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-black/10`}>
              <div className={`text-3xl font-bold ${item.color} mb-2`}>{item.count}</div>
              <div className="text-xs font-medium text-muted-foreground/80">{item.label}</div>
            </div>
          ))}
        </CardContent>
      </Card>
      {isEmpty && (
        <Card className="glass-card border-dashed border-white/8">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mb-4">
              <Heart className="w-6 h-6 text-muted-foreground/40" />
            </div>
            <p className="text-muted-foreground/70 text-center text-sm">No medical information recorded yet.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MedicalDashboard;
