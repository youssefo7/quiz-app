// Has at least an Ok button
export interface PopupMessageConfig {
    message: string;
    hasCancelButton: boolean;
    okButtonText?: string;
    cancelButtonText?: string;
    okButtonFunction?: () => void;
    cancelButtonFunction?: () => void;
}
