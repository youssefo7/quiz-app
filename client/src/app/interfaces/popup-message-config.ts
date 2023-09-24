export interface PopupMessageConfig {
    message: string;
    hasOkButton?: boolean;
    hasCancelButton?: boolean;
    okButtonText?: string;
    cancelButtonText?: string;
    okButtonFunction?: () => void;
    cancelButtonFunction?: () => void;
}
