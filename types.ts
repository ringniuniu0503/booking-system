import React from 'react';

export interface Doctor {
  id: number;
  name: string;
  specialty: string;
  image: string;
}

export interface TimeSlot {
  id: string;
  label: string;
}

export interface VisitType {
  id: string;
  label: string;
  deduction: string; // e.g., "扣 10 分鐘"
  value: string;
}

export interface AppointmentData {
  phoneNumber: string;
  date: string;
  name: string;
  birthday: string;
  idNumber: string;
  doctor: Doctor | null;
  timeSlot: TimeSlot | null;
  visitType: VisitType | null;
}

export enum AppStage {
  VERIFY_PHONE = 'VERIFY_PHONE',
  FILL_FORM = 'FILL_FORM',
  SUCCESS = 'SUCCESS',
}

export enum Step {
  VERIFY_PHONE = 'VERIFY_PHONE',
  SELECT_DATE = 'SELECT_DATE',
  CONFIRM_DATE = 'CONFIRM_DATE',
  INPUT_NAME = 'INPUT_NAME',
  INPUT_BIRTHDAY = 'INPUT_BIRTHDAY',
  INPUT_ID = 'INPUT_ID',
  SELECT_DOCTOR = 'SELECT_DOCTOR',
  SELECT_TIME = 'SELECT_TIME',
  SELECT_TYPE = 'SELECT_TYPE',
  COMPLETED = 'COMPLETED',
}

export enum Sender {
  USER = 'USER',
  SYSTEM = 'SYSTEM',
}

export interface Message {
  id: string;
  text: string | React.ReactNode;
  sender: Sender;
  timestamp: Date;
}