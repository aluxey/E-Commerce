import React, { useState } from 'react';
import {
  Button,
  Input,
  Card,
  Skeleton,
  Badge,
  Toast,
  Modal,
  BlurUpImage,
  ProductCardSkeleton,
  ListSkeleton,
  LoadingSpinner,
  LoadingDots,
  LoadingBar,
  FloatingLabelInput,
  FormField,
  CharacterCounter,
  PasswordStrength,
  useFormValidation,
  validationRules,
  FormSteps,
} from '../components/ui';

const UIDemo = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [progress, setProgress] = useState(25);
  const [currentStep, setCurrentStep] = useState(0);
  const [showToast, setShowToast] = useState(false);
  const [password, setPassword] = useState('');
  const [description, setDescription] = useState('');

  const { values, errors, setValue, setTouchedField, handleSubmit, resetForm } = useFormValidation(
    { name: '', email: '', password: '', confirmPassword: '' },
    {
      name: validationRules.required('Name is required'),
      email: validationRules.email(),
      password: validationRules.password(),
      confirmPassword: validationRules.match('password', 'Passwords must match'),
    }
  );

  const steps = [
    { title: 'Account Info', description: 'Basic information' },
    { title: 'Preferences', description: 'Customize your experience' },
    { title: 'Review', description: 'Confirm your details' },
  ];

  React.useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => (prev >= 100 ? 0 : prev + 10));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      {/* Hero Section */}
      <section className="container mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h1 className="hero-title mb-4">World-Class UI Components</h1>
          <p className="hero-subtext">
            Experience the stunning, polished interface that rivals industry leaders like Stripe
          </p>
        </div>

        {/* Buttons Section */}
        <Card className="mb-8">
          <h2 className="section-title mb-6">Button Components</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="accent">Accent</Button>
            <Button variant="danger">Danger</Button>
            <Button variant="success">Success</Button>
            <Button loading>Loading</Button>
          </div>
          <div className="mt-6 flex gap-4 flex-wrap">
            <Button size="xs">Extra Small</Button>
            <Button size="sm">Small</Button>
            <Button size="md">Medium</Button>
            <Button size="lg">Large</Button>
            <Button size="xl">Extra Large</Button>
          </div>
        </Card>

        {/* Input Components */}
        <Card className="mb-8">
          <h2 className="section-title mb-6">Input Components</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Input
                label="Standard Input"
                placeholder="Enter your text..."
                helperText="This is helper text"
              />
            </div>
            <div>
              <Input
                label="Input with Error"
                placeholder="Enter email..."
                error="Please enter a valid email"
              />
            </div>
            <div>
              <Input
                label="Input with Icon"
                placeholder="Search..."
                leftIcon={<span>🔍</span>}
              />
            </div>
            <div>
              <Input
                label="Disabled Input"
                placeholder="Disabled field"
                disabled
              />
            </div>
          </div>
        </Card>

        {/* Floating Label Inputs */}
        <Card className="mb-8">
          <h2 className="section-title mb-6">Floating Label Inputs</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FloatingLabelInput
              label="Your Name"
              value={values.name}
              onChange={(e) => setValue('name', e.target.value)}
              onBlur={() => setTouchedField('name')}
              error={errors.name}
            />
            <FloatingLabelInput
              label="Email Address"
              type="email"
              value={values.email}
              onChange={(e) => setValue('email', e.target.value)}
              onBlur={() => setTouchedField('email')}
              error={errors.email}
            />
            <FloatingLabelInput
              label="Password"
              type="password"
              value={values.password}
              onChange={(e) => {
                setValue('password', e.target.value);
                setPassword(e.target.value);
              }}
              onBlur={() => setTouchedField('password')}
              error={errors.password}
            />
            <FloatingLabelInput
              label="Confirm Password"
              type="password"
              value={values.confirmPassword}
              onChange={(e) => setValue('confirmPassword', e.target.value)}
              onBlur={() => setTouchedField('confirmPassword')}
              error={errors.confirmPassword}
            />
          </div>
          {password && (
            <div className="mt-4">
              <PasswordStrength password={password} />
            </div>
          )}
        </Card>

        {/* Loading States */}
        <Card className="mb-8">
          <h2 className="section-title mb-6">Loading States</h2>
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <LoadingSpinner size="xs" />
              <LoadingSpinner size="sm" />
              <LoadingSpinner size="md" />
              <LoadingSpinner size="lg" />
              <LoadingSpinner size="xl" />
            </div>
            <div className="flex items-center gap-4">
              <LoadingDots text="Loading" />
              <LoadingBar progress={progress} />
            </div>
          </div>
        </Card>

        {/* Skeleton Components */}
        <Card className="mb-8">
          <h2 className="section-title mb-6">Skeleton Components</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ProductCardSkeleton />
            <ListSkeleton count={3} />
          </div>
        </Card>

        {/* Badges */}
        <Card className="mb-8">
          <h2 className="section-title mb-6">Badges</h2>
          <div className="flex gap-4 flex-wrap">
            <Badge variant="default">Default</Badge>
            <Badge variant="primary">Primary</Badge>
            <Badge variant="success">Success</Badge>
            <Badge variant="error">Error</Badge>
            <Badge variant="warning">Warning</Badge>
            <Badge variant="info">Info</Badge>
          </div>
          <div className="flex gap-4 mt-4">
            <Badge variant="primary" shape="pill">Pill</Badge>
            <Badge variant="primary" shape="rounded">Rounded</Badge>
            <Badge variant="primary" shape="square">Square</Badge>
          </div>
        </Card>

        {/* Form Steps */}
        <Card className="mb-8">
          <h2 className="section-title mb-6">Form Steps</h2>
          <FormSteps
            currentStep={currentStep}
            steps={steps}
            onStepChange={setCurrentStep}
          />
        </Card>

        {/* Character Counter */}
        <Card className="mb-8">
          <h2 className="section-title mb-6">Advanced Form Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <textarea
                className="w-full p-3 border rounded-lg"
                rows={4}
                placeholder="Enter description..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={100}
              />
              <CharacterCounter current={description.length} max={100} />
            </div>
          </div>
        </Card>

        {/* Interactive Components */}
        <Card className="mb-8">
          <h2 className="section-title mb-6">Interactive Components</h2>
          <div className="flex gap-4">
            <Button onClick={() => setShowToast(true)}>Show Toast</Button>
            <Button onClick={() => setIsModalOpen(true)}>Open Modal</Button>
          </div>
        </Card>

        {/* Cards with Hover Effects */}
        <Card className="mb-8 hoverable">
          <h2 className="section-title mb-6">Interactive Cards</h2>
          <p className="text-muted">
            Hover over this card to see the lift effect and smooth transitions.
          </p>
        </Card>
      </section>

      {/* Toast */}
      {showToast && (
        <Toast
          title="Success!"
          description="This is a world-class toast notification"
          variant="success"
          onClose={() => setShowToast(false)}
        />
      )}

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Stunning Modal"
        description="This modal showcases the world-class design system"
        size="md"
      >
        <div className="space-y-4">
          <p>
            This modal features smooth animations, proper focus management,
            and beautiful visual design that rivals industry leaders.
          </p>
          <div className="flex gap-4 justify-end">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setIsModalOpen(false)}>
              Confirm
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default UIDemo;