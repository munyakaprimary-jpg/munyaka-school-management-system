import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label"; // 👈 Added import for Label
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Modal from "@/components/ui/Modal";
import BackButton from "@/components/ui/BackButton";
import { Search, Package, Box, RefreshCw, MoreVertical, UserCheck, Clock, Plus, Trash2, Save, X } from 'lucide-react';
import { INVENTORY, ASSET_LOGS } from '@/lib/mock-data';
import { showSuccess } from '@/utils/toast';