export interface BankDetails {
  bankName: string;
  ifscCode: string;
  accountNumber: string;
}

export interface Address {
  addressCity: string;
  addressLine: string;
  addressCountry: string;
  addressState: string;
  addressPincode: string;
}

export interface Dependent {
  name: string;
  gender: string;
  dob: string;
  mobileNumber: string;
  profession: string;
  relation: string;
  email: string;
}

export interface Employee {
  name: string;
  email: string;
  doj: string;
  status: string;
  employmentType: string;
  gender: string;
  id: string;
  employeeId: string;
  dob: string;
  pan: string;
  personalEmail: string;
  fatherName: string;
  bloodGroup: string;
  designation: string;
  department: string;
  mobileNumber: string;
  manager: string;
  maritalStatus: string;
  nationality: string;
  aadhar: string;
  uan: string;
  bankDetails: BankDetails;
  currentAddress: Address;
  permanentAddress: Address;
  dependentDetails: Dependent[];
}

export interface Organization {
  orgId: string;
  orgName: string;
  orgCin: string;
  hrms: number;
  status: string;
  invitedBy: string | null;
  acceptedBy: string | null;
  terminatedBy: string | null;
}

export interface WebhookEvent {
  requestId: string;
  orgId: string;
  'vendor.orgId': string;
  event: string;
  eventType: string;
  recordCount: number | null;
  body: Employee[] | Organization[] | any[];
  timeStamp: string;
  statusCode: string;
  message: string;
}

export interface Remark {
  remark: string;
  persona: string;
  editedBy: string;
  id: string;
}