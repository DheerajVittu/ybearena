export type BookingType = {
    created_at:string;
    Name:string;
    Phone:string;
    SlotDate:string;
    StartTime:string;
    EndTime:string;
    UTR:string;
    PaymentImage:string;
    Amount:number;
    PaymentType:string;
    BalanceAmount:number;
    CouponCode:string;
    Status:string;
}

export type BankAccountType = {
    id:number;
    AccountNumber:string;
    Message:string;
    Phone:string;
    Scanner:string;
    created_at:string;
    Upi:string;
}

export type CouponType = {
    id:number;
    Name:string;
    Percentage:number;
    Used:number;
    MaxUses:number;
    created_at:string;
}